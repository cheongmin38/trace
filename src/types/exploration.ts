import type { Coordinates, Place, Visit } from '@/types/trace';

export type TraceRegion = {
  id: string;
  countryCode: string;
  level: 'city' | 'district';
  name: string;
  centerCoordinate: Coordinates;
};

export type UserRegionDiscovery = TraceRegion & {
  firstVisitedAt: string;
  lastVisitedAt: string;
  visitCount: number;
  placeCount: number;
  photoCount: number;
};

export type ExplorationSummary = {
  visitedRegions: number;
  visitedPlaces: number;
  visitCount: number;
  photoCount: number;
  routeDistanceMeters: number;
  newRegions: UserRegionDiscovery[];
};

export type RegionSourceVisit = Pick<Visit, 'startedAt' | 'placeId'>;
export type RegionSourcePlace = Pick<Place, 'id' | 'address' | 'location' | 'photoCount'>;
