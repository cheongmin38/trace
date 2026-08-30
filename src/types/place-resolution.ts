import type { Place, ResolvedPlaceCategory } from '@/types/trace';

export type PlaceResolutionCandidate = {
  name: string;
  address: string;
  category: ResolvedPlaceCategory;
  latitude: number;
  longitude: number;
  externalPlaceId: string;
  confidence: number;
  providerId: string;
  source: 'poi' | 'address' | 'fallback';
};

export type PlaceResolutionContext = {
  latitude: number;
  longitude: number;
};

export interface PlaceResolutionProvider {
  readonly id: string;
  resolvePlace(context: PlaceResolutionContext): Promise<PlaceResolutionCandidate[]>;
}

export type PlaceResolutionResult = {
  place: Place;
  candidate: PlaceResolutionCandidate | null;
  reusedExistingPlace: boolean;
  fromCache: boolean;
};

export type PlaceResolutionCacheEntry = {
  key: string;
  placeId: string;
  candidate: PlaceResolutionCandidate | null;
  cachedAt: string;
  expiresAt: string;
};
