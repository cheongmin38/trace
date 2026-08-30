import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocationTrackingPreferences, RoutePoint, VisitDetectionSnapshot } from '@/types/location';
import type { Memory, Place, Visit } from '@/types/trace';
import type { PlaceResolutionCacheEntry } from '@/types/place-resolution';
import { isValidCoordinates } from '@/utils/geo';

const STORAGE_KEYS = {
  places: 'trace:location:places:v1',
  visits: 'trace:location:visits:v1',
  memories: 'trace:location:memories:v1',
  placeResolutionCache: 'trace:location:place-resolution-cache:v1',
  engine: 'trace:location:engine:v1',
  preferences: 'trace:location:preferences:v1',
  error: 'trace:location:error:v1',
  routePoints: 'trace:location:route-points:v1',
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPlace(value: unknown): value is Place {
  if (!isRecord(value) || !isRecord(value.location)) return false;
  return typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.category === 'string'
    && isValidCoordinates({ latitude: Number(value.location.latitude), longitude: Number(value.location.longitude) });
}

function isVisit(value: unknown): value is Visit {
  if (!isRecord(value) || !isRecord(value.location)) return false;
  return typeof value.id === 'string'
    && typeof value.placeId === 'string'
    && typeof value.startedAt === 'string'
    && typeof value.visitNumber === 'number'
    && (value.source === 'gps' || value.source === 'mock')
    && typeof value.createdAt === 'string'
    && isValidCoordinates({ latitude: Number(value.location.latitude), longitude: Number(value.location.longitude) });
}

function isMemory(value: unknown): value is Memory {
  if (!isRecord(value) || !isRecord(value.location) || !Array.isArray(value.photos)) return false;
  return typeof value.id === 'string'
    && typeof value.placeId === 'string'
    && typeof value.visitId === 'string'
    && typeof value.title === 'string'
    && typeof value.startedAt === 'string'
    && typeof value.endedAt === 'string'
    && typeof value.createdAt === 'string'
    && typeof value.visitNumber === 'number'
    && isValidCoordinates({ latitude: Number(value.location.latitude), longitude: Number(value.location.longitude) });
}

function isSnapshot(value: unknown): value is VisitDetectionSnapshot {
  if (!isRecord(value)) return false;
  return ['idle', 'candidate', 'confirmed', 'ended'].includes(String(value.status))
    && typeof value.updatedAt === 'string';
}

async function readUnknown(key: string): Promise<unknown> {
  const value = await AsyncStorage.getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch (error) {
    console.error(`Trace local data could not be decoded for ${key}`, error);
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function readPersistedPlaces(): Promise<Place[]> {
  const value = await readUnknown(STORAGE_KEYS.places);
  return Array.isArray(value) ? value.filter(isPlace) : [];
}

export async function writePersistedPlaces(places: Place[]): Promise<void> {
  await writeJson(STORAGE_KEYS.places, places);
}

export async function readPersistedVisits(): Promise<Visit[]> {
  const value = await readUnknown(STORAGE_KEYS.visits);
  return Array.isArray(value) ? value.filter(isVisit) : [];
}

export async function writePersistedVisits(visits: Visit[]): Promise<void> {
  await writeJson(STORAGE_KEYS.visits, visits);
}

export async function readPersistedMemories(): Promise<Memory[]> {
  const value = await readUnknown(STORAGE_KEYS.memories);
  return Array.isArray(value) ? value.filter(isMemory) : [];
}

export async function writePersistedMemories(memories: Memory[]): Promise<void> {
  await writeJson(STORAGE_KEYS.memories, memories);
}

export async function readPlaceResolutionCache(): Promise<PlaceResolutionCacheEntry[]> {
  const value = await readUnknown(STORAGE_KEYS.placeResolutionCache);
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is PlaceResolutionCacheEntry => isRecord(entry)
    && typeof entry.key === 'string'
    && typeof entry.placeId === 'string'
    && typeof entry.cachedAt === 'string'
    && typeof entry.expiresAt === 'string');
}

export async function writePlaceResolutionCache(entries: PlaceResolutionCacheEntry[]): Promise<void> {
  await writeJson(STORAGE_KEYS.placeResolutionCache, entries);
}

export async function readEngineSnapshot(): Promise<VisitDetectionSnapshot | null> {
  const value = await readUnknown(STORAGE_KEYS.engine);
  return isSnapshot(value) ? value : null;
}

export async function writeEngineSnapshot(snapshot: VisitDetectionSnapshot): Promise<void> {
  await writeJson(STORAGE_KEYS.engine, snapshot);
}

export async function readTrackingPreferences(): Promise<LocationTrackingPreferences> {
  const value = await readUnknown(STORAGE_KEYS.preferences);
  if (!isRecord(value)) return { trackingEnabled: false, backgroundTrackingEnabled: false };
  return {
    trackingEnabled: value.trackingEnabled === true,
    backgroundTrackingEnabled: value.backgroundTrackingEnabled === true,
  };
}

export async function writeTrackingPreferences(preferences: LocationTrackingPreferences): Promise<void> {
  await writeJson(STORAGE_KEYS.preferences, preferences);
}

export async function readTrackingError(): Promise<string | null> {
  const value = await readUnknown(STORAGE_KEYS.error);
  return typeof value === 'string' ? value : null;
}

export async function writeTrackingError(message: string | null): Promise<void> {
  if (message) await writeJson(STORAGE_KEYS.error, message);
  else await AsyncStorage.removeItem(STORAGE_KEYS.error);
}

export async function readPersistedRoutePoints(): Promise<RoutePoint[]> {
  const value = await readUnknown(STORAGE_KEYS.routePoints);
  return Array.isArray(value) ? value.filter((item): item is RoutePoint => isRecord(item) && typeof item.id === 'string' && typeof item.timestamp === 'string' && typeof item.source === 'string' && isValidCoordinates({ latitude: Number(item.latitude), longitude: Number(item.longitude) })) : [];
}

export async function writePersistedRoutePoints(points: RoutePoint[]): Promise<void> {
  // Keep the local cache bounded; the full history can later move to a sync repository.
  await writeJson(STORAGE_KEYS.routePoints, points.slice(-20_000));
}

export async function clearLocationPersistence(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}
