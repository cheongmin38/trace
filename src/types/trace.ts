export type PlaceCategory = 'HOME' | 'WORK' | 'PLACE' | 'TRAVEL' | 'TRANSIT' | 'UNKNOWN';
export type PlaceKind = 'CAFE' | 'PARK' | 'FOOD' | 'TRAVEL' | 'CULTURE' | 'OTHER';
export type ResolvedPlaceCategory =
  | 'home'
  | 'work'
  | 'cafe'
  | 'restaurant'
  | 'park'
  | 'shopping'
  | 'travel'
  | 'culture'
  | 'school'
  | 'hotel'
  | 'transit'
  | 'other';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Photo = {
  id: string;
  assetId?: string;
  userId?: string;
  uri: string;
  takenAt: string;
  location?: Coordinates;
  width?: number;
  height?: number;
  filename?: string;
  mediaSubtypes?: string[];
  isScreenshot?: boolean;
  isLocallyAvailable?: boolean;
  source?: 'media-library' | 'mock' | 'manual';
  match?: {
    confidence: number;
    timeScore: number;
    locationScore: number | null;
    capturedDuringVisit: boolean;
    distanceMeters: number | null;
    matchedAt: string;
  };
};

export type Place = {
  id: string;
  userId?: string;
  name: string;
  category: PlaceCategory;
  kind?: PlaceKind;
  resolvedCategory?: ResolvedPlaceCategory;
  location: Coordinates;
  address?: string;
  externalPlaceId?: string;
  providerId?: string;
  resolutionConfidence?: number;
  resolutionSource?: 'poi' | 'address' | 'fallback' | 'user';
  resolvedAt?: string;
  isUserNamed?: boolean;
  coverPhoto?: string;
  visitCount: number;
  photoCount: number;
  firstVisitedAt?: string;
  lastVisitedAt?: string;
  createdAt?: string;
};

export type Visit = {
  id: string;
  userId?: string;
  placeId: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  visitNumber: number;
  location: Coordinates;
  source: 'gps' | 'mock' | 'demo';
  confidence?: number;
  createdAt: string;
  memoryIds?: string[];
  memoryProcessingStatus?: 'pending' | 'processing' | 'completed' | 'noPhotos' | 'failed';
  memoryProcessingUpdatedAt?: string;
  memoryProcessingError?: 'photoPermissionDenied' | 'photoPermissionLimited' | 'libraryUnavailable' | 'noUniquePhotos';
  mockPhotos?: Photo[];
};

export type Memory = {
  id: string;
  userId?: string;
  placeId: string;
  visitId: string;
  title: string;
  visitNumber: number;
  startedAt: string;
  endedAt: string;
  photos: Photo[];
  coverPhotoId?: string;
  excludedPhotoIds?: string[];
  location: Coordinates;
  summary?: string;
  createdAt: string;
  isFavorite?: boolean;
};

export type UserStats = {
  placeCount: number;
  visitCount: number;
  memoryCount: number;
  photoCount: number;
  regionCount: number;
};

export type AppSettings = {
  locationTrackingEnabled: boolean;
  photoMatchingEnabled: boolean;
  includeScreenshotsInMemories: boolean;
  automaticMemoryEnabled: boolean;
  notificationsEnabled: boolean;
  showHomeMemories: boolean;
  showWorkMemories: boolean;
};

export type TimelineFilter = 'ALL' | 'RECENT_7_DAYS' | 'RECENT_30_DAYS' | 'WITH_PHOTOS' | 'FREQUENT_PLACES';

export type ThemePreference = 'system' | 'light' | 'dark';

export type User = {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  provider: 'apple' | 'google' | 'email';
  createdAt: string;
};

export type ProfileIdentity = {
  name: string;
  handle: string;
  joinedAt: string;
  plan: 'Free' | 'Trace Plus';
};

export type Trip = {
  id: string;
  title: string;
  startedAt: string;
  endedAt: string;
  placeIds: string[];
  memoryIds: string[];
  coverPhoto?: Photo;
};

export type TodayTrace = {
  place: Place;
  memory: Memory | null;
  isNewPlace: boolean;
  title: string;
  message: string;
};

export type NearbyMemory = {
  place: Place;
  latestMemory: Memory;
  distanceMeters: number;
};

export type MonthlyTrace = {
  year: number;
  month: number;
  placeCount: number;
  memoryCount: number;
  photoCount: number;
  mostVisitedPlace: Place | null;
  mostVisitedCount: number;
  newPlaceCount: number;
  representativePhotos: Photo[];
};

export type MonthlyTracePoint = {
  month: number;
  placeCount: number;
  memoryCount: number;
  photoCount: number;
};

export type YearlyTrace = {
  year: number;
  placeCount: number;
  memoryCount: number;
  photoCount: number;
  regionCount: number;
  mostVisitedPlace: Place | null;
  mostVisitedCount: number;
  farthestPlace: Place | null;
  mostActiveMonth: number | null;
  months: MonthlyTracePoint[];
};
