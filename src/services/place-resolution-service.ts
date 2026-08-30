import { placeRepository, type PlaceRepository } from '@/repositories/place-repository';
import { placeResolutionCacheRepository } from '@/repositories/place-resolution-cache-repository';
import { ExpoReverseGeocodingProvider } from '@/services/place-resolution-provider';
import type {
  PlaceResolutionCacheEntry,
  PlaceResolutionCandidate,
  PlaceResolutionProvider,
  PlaceResolutionResult,
} from '@/types/place-resolution';
import type { Place, PlaceCategory, PlaceKind, ResolvedPlaceCategory } from '@/types/trace';
import { isValidCoordinates } from '@/utils/geo';

const EXISTING_PLACE_RADIUS_METERS = 100;
const CACHE_GRID_DECIMALS = 4;
const HOUR_MS = 60 * 60_000;
const inFlight = new Map<string, Promise<PlaceResolutionResult | null>>();

export interface PlaceResolutionCacheStore {
  get(key: string, now?: number): Promise<PlaceResolutionCacheEntry | null>;
  set(entry: PlaceResolutionCacheEntry): Promise<void>;
}

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(CACHE_GRID_DECIMALS)}:${longitude.toFixed(CACHE_GRID_DECIMALS)}`;
}

function stableHash(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

function legacyCategory(category: ResolvedPlaceCategory): PlaceCategory {
  if (category === 'home') return 'HOME';
  if (category === 'work') return 'WORK';
  if (category === 'transit') return 'TRANSIT';
  if (category === 'travel' || category === 'hotel') return 'TRAVEL';
  return 'PLACE';
}

function legacyKind(category: ResolvedPlaceCategory): PlaceKind {
  if (category === 'cafe') return 'CAFE';
  if (category === 'restaurant') return 'FOOD';
  if (category === 'park') return 'PARK';
  if (category === 'travel' || category === 'hotel') return 'TRAVEL';
  if (category === 'culture' || category === 'school') return 'CULTURE';
  return 'OTHER';
}

function fallbackCandidate(latitude: number, longitude: number): PlaceResolutionCandidate {
  const key = cacheKey(latitude, longitude);
  return {
    name: '새로운 장소',
    address: '주변 주소를 확인 중이에요',
    category: 'other',
    latitude,
    longitude,
    externalPlaceId: `coordinate-${stableHash(key)}`,
    confidence: 0.25,
    providerId: 'trace-coordinate-fallback',
    source: 'fallback',
  };
}

function placeFromCandidate(candidate: PlaceResolutionCandidate, now: string): Place {
  return {
    id: `resolved-${stableHash(`${candidate.providerId}:${candidate.externalPlaceId}`)}`,
    name: candidate.name,
    category: legacyCategory(candidate.category),
    kind: legacyKind(candidate.category),
    resolvedCategory: candidate.category,
    location: { latitude: candidate.latitude, longitude: candidate.longitude },
    address: candidate.address,
    externalPlaceId: candidate.externalPlaceId,
    providerId: candidate.providerId,
    resolutionConfidence: candidate.confidence,
    resolutionSource: candidate.source,
    resolvedAt: now,
    visitCount: 0,
    photoCount: 0,
    createdAt: now,
  };
}

function cacheLifetime(candidate: PlaceResolutionCandidate): number {
  if (candidate.source === 'poi') return 90 * 24 * HOUR_MS;
  if (candidate.source === 'address') return 30 * 24 * HOUR_MS;
  return 6 * HOUR_MS;
}

export class PlaceResolutionService {
  constructor(
    private readonly providers: PlaceResolutionProvider[] = [new ExpoReverseGeocodingProvider()],
    private readonly repository: PlaceRepository = placeRepository,
    private readonly cache: PlaceResolutionCacheStore = placeResolutionCacheRepository,
  ) {}

  private async queryProviders(latitude: number, longitude: number): Promise<PlaceResolutionCandidate[]> {
    const candidates: PlaceResolutionCandidate[] = [];
    for (const provider of this.providers) {
      try {
        const results = await provider.resolvePlace({ latitude, longitude });
        candidates.push(...results.filter((candidate) => isValidCoordinates({
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        }) && Boolean(candidate.name.trim())));
      } catch (error) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) console.info('[Trace place] Place provider failed; continuing with fallback.', {
          providerId: provider.id,
          error,
        });
      }
    }
    return candidates.sort((left, right) => right.confidence - left.confidence);
  }

  async resolvePlace(latitude: number, longitude: number): Promise<PlaceResolutionResult | null> {
    const coordinates = { latitude, longitude };
    if (!isValidCoordinates(coordinates)) return null;
    const key = cacheKey(latitude, longitude);
    const running = inFlight.get(key);
    if (running) return running;

    const operation = (async () => {
      const nearby = await this.repository.findNearbyPlaces(
        latitude,
        longitude,
        EXISTING_PLACE_RADIUS_METERS,
      );
      if (nearby[0]) {
        return {
          place: nearby[0].place,
          candidate: null,
          reusedExistingPlace: true,
          fromCache: false,
        };
      }

      const cached = await this.cache.get(key);
      if (cached) {
        const cachedPlace = await this.repository.getPlaceById(cached.placeId);
        if (cachedPlace) {
          return {
            place: cachedPlace,
            candidate: cached.candidate,
            reusedExistingPlace: true,
            fromCache: true,
          };
        }
      }

      const candidates = await this.queryProviders(latitude, longitude);
      const candidate = candidates[0] ?? fallbackCandidate(latitude, longitude);
      const now = new Date().toISOString();
      const place = await this.repository.createOrReusePlace(
        placeFromCandidate(candidate, now),
        EXISTING_PLACE_RADIUS_METERS,
      );
      await this.cache.set({
        key,
        placeId: place.id,
        candidate,
        cachedAt: now,
        expiresAt: new Date(Date.now() + cacheLifetime(candidate)).toISOString(),
      });
      return {
        place,
        candidate,
        reusedExistingPlace: place.externalPlaceId !== candidate.externalPlaceId,
        fromCache: false,
      };
    })().catch((error) => {
      console.error('Trace place resolution failed without blocking Visit processing.', error);
      return null;
    }).finally(() => inFlight.delete(key));

    inFlight.set(key, operation);
    return operation;
  }
}

export const placeResolutionService = new PlaceResolutionService();

export function resolvePlace(latitude: number, longitude: number): Promise<PlaceResolutionResult | null> {
  return placeResolutionService.resolvePlace(latitude, longitude);
}
