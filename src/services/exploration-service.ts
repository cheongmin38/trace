import type { ExplorationSummary, UserRegionDiscovery } from '@/types/exploration';
import type { Place, Visit } from '@/types/trace';
import type { RoutePoint } from '@/types/location';
import { distanceInMeters } from '@/utils/geo';

function regionName(place: Place): string | null {
  // Resolved addresses are provider data; avoid guessing a region from coordinates.
  const tokens = place.address?.trim().split(/\s+/).filter(Boolean) ?? [];
  return tokens.length ? tokens.slice(0, 2).join(' ') : null;
}

export function deriveRegionDiscoveries(places: Place[], visits: Visit[]): UserRegionDiscovery[] {
  const byName = new Map<string, UserRegionDiscovery>();
  const placeIdsByRegion = new Map<string, Set<string>>();
  visits.forEach((visit) => {
    const place = places.find((item) => item.id === visit.placeId);
    const name = place && regionName(place);
    if (!place || !name) return;
    const current = byName.get(name);
    if (!current) {
      byName.set(name, { id: `region-${name}`, countryCode: 'KR', level: 'district', name, centerCoordinate: place.location, firstVisitedAt: visit.startedAt, lastVisitedAt: visit.startedAt, visitCount: 1, placeCount: 1, photoCount: place.photoCount });
      placeIdsByRegion.set(name, new Set([place.id]));
      return;
    }
    current.firstVisitedAt = current.firstVisitedAt < visit.startedAt ? current.firstVisitedAt : visit.startedAt;
    current.lastVisitedAt = current.lastVisitedAt > visit.startedAt ? current.lastVisitedAt : visit.startedAt;
    current.visitCount += 1;
    const placeIds = placeIdsByRegion.get(name) ?? new Set<string>();
    placeIds.add(place.id);
    placeIdsByRegion.set(name, placeIds);
    current.placeCount = placeIds.size;
    current.photoCount += place.photoCount;
  });
  return [...byName.values()].sort((a, b) => b.lastVisitedAt.localeCompare(a.lastVisitedAt));
}

export function summarizeExploration(places: Place[], visits: Visit[], routePoints: RoutePoint[], now = new Date()): ExplorationSummary {
  const regions = deriveRegionDiscoveries(places, visits);
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
  const newRegions = regions.filter((region) => region.firstVisitedAt >= yearStart);
  let routeDistanceMeters = 0;
  for (let index = 1; index < routePoints.length; index += 1) routeDistanceMeters += distanceInMeters(routePoints[index - 1], routePoints[index]);
  return { visitedRegions: regions.length, visitedPlaces: new Set(visits.map((visit) => visit.placeId)).size, visitCount: visits.length, photoCount: places.reduce((sum, place) => sum + place.photoCount, 0), routeDistanceMeters, newRegions };
}
