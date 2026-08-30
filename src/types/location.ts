import type { Place, Visit } from '@/types/trace';

export type LocationPermissionStatus =
  | 'unknown'
  | 'foreground-granted'
  | 'background-granted'
  | 'denied'
  | 'restricted'
  | 'unsupported';

export type LocationSource = 'gps' | 'mock';

export type LocationPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
};

export type RoutePoint = LocationPoint & {
  id: string;
  source: LocationSource;
};

export type VisitDetectionStatus = 'idle' | 'candidate' | 'confirmed' | 'ended';

export type VisitCandidate = {
  placeId: string;
  enteredAt: string;
  lastInsideAt: string;
  sampleCount: number;
  source: LocationSource;
};

export type VisitDetectionSnapshot = {
  status: VisitDetectionStatus;
  candidate: VisitCandidate | null;
  confirmedVisitId: string | null;
  lastPoint: LocationPoint | null;
  updatedAt: string;
};

export type LocationTrackingPreferences = {
  trackingEnabled: boolean;
  backgroundTrackingEnabled: boolean;
};

export type VisitDetectionIgnoredReason =
  | 'invalid-location'
  | 'poor-accuracy'
  | 'duplicate-event'
  | 'moving-too-fast'
  | 'no-nearby-place'
  | 'cooldown';

export type VisitDetectionResult = {
  snapshot: VisitDetectionSnapshot;
  matchedPlace: Place | null;
  createdVisit: Visit | null;
  updatedVisit: Visit | null;
  endedVisit: Visit | null;
  ignoredReason?: VisitDetectionIgnoredReason;
};

export type MapVisitPin = {
  id: string;
  placeId: string;
  title: string;
  latitude: number;
  longitude: number;
  imageUri: string;
  visitCount: number;
  lastVisitedAt?: string;
  memoryId?: string;
};
