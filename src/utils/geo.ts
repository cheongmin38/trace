import type { Coordinates } from '@/types/trace';

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => degrees * Math.PI / 180;

export function distanceInMeters(left: Coordinates, right: Coordinates): number {
  const latitudeDelta = toRadians(right.latitude - left.latitude);
  const longitudeDelta = toRadians(right.longitude - left.longitude);
  const leftLatitude = toRadians(left.latitude);
  const rightLatitude = toRadians(right.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function calculateDistanceMeters(left: Coordinates, right: Coordinates): number {
  return distanceInMeters(left, right);
}

export function isWithinRadius(left: Coordinates, right: Coordinates, radiusMeters: number): boolean {
  return distanceInMeters(left, right) <= radiusMeters;
}

export function isValidCoordinates(value: Coordinates): boolean {
  return Number.isFinite(value.latitude)
    && Number.isFinite(value.longitude)
    && value.latitude >= -90
    && value.latitude <= 90
    && value.longitude >= -180
    && value.longitude <= 180;
}
