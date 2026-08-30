import { readPersistedRoutePoints, writePersistedRoutePoints } from '@/repositories/local-storage';
import type { LocationPoint, RoutePoint } from '@/types/location';
import { calculateDistanceMeters, isValidCoordinates } from '@/utils/geo';

const MIN_POINT_DISTANCE_METERS = 25;
const MAX_JUMP_METERS = 5_000;
const MAX_ACCURACY_METERS = 100;

export async function appendRoutePoint(point: LocationPoint, source: RoutePoint['source']): Promise<RoutePoint | null> {
  if (!isValidCoordinates(point) || (point.accuracy !== undefined && point.accuracy > MAX_ACCURACY_METERS)) return null;
  const existing = await readPersistedRoutePoints();
  const previous = existing.at(-1);
  if (previous) {
    if (new Date(point.timestamp).getTime() <= new Date(previous.timestamp).getTime()) return null;
    const distance = calculateDistanceMeters(previous, point);
    if (distance < MIN_POINT_DISTANCE_METERS || distance > MAX_JUMP_METERS) return null;
  }
  const routePoint: RoutePoint = { ...point, id: `route-${new Date(point.timestamp).getTime()}-${Math.round(point.latitude * 1e5)}`, source };
  await writePersistedRoutePoints([...existing, routePoint]);
  return routePoint;
}

export async function getRoutePoints(start?: string, end?: string): Promise<RoutePoint[]> {
  const points = await readPersistedRoutePoints();
  return points.filter((point) => (!start || point.timestamp >= start) && (!end || point.timestamp <= end));
}

function perpendicularDistance(point: RoutePoint, start: RoutePoint, end: RoutePoint): number {
  const x = point.longitude; const y = point.latitude;
  const dx = end.longitude - start.longitude; const dy = end.latitude - start.latitude;
  if (dx === 0 && dy === 0) return calculateDistanceMeters(point, start);
  const t = Math.max(0, Math.min(1, ((x - start.longitude) * dx + (y - start.latitude) * dy) / (dx * dx + dy * dy)));
  return calculateDistanceMeters(point, { latitude: start.latitude + t * dy, longitude: start.longitude + t * dx });
}

export function simplifyRoute(points: RoutePoint[], toleranceMeters = 35): RoutePoint[] {
  if (points.length < 3) return points;
  let maxDistance = 0; let index = 0;
  points.slice(1, -1).forEach((point, offset) => {
    const distance = perpendicularDistance(point, points[0], points.at(-1)!);
    if (distance > maxDistance) { maxDistance = distance; index = offset + 1; }
  });
  if (maxDistance <= toleranceMeters) return [points[0], points.at(-1)!];
  return [...simplifyRoute(points.slice(0, index + 1), toleranceMeters).slice(0, -1), ...simplifyRoute(points.slice(index), toleranceMeters)];
}
