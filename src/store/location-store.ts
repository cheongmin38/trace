import { create } from 'zustand';
import type {
  LocationPermissionStatus,
  LocationPoint,
  VisitDetectionSnapshot,
} from '@/types/location';

type LocationState = {
  initialized: boolean;
  permissionStatus: LocationPermissionStatus;
  isTracking: boolean;
  lastLocation: LocationPoint | null;
  lastUpdatedAt: string | null;
  backgroundTrackingEnabled: boolean;
  trackingError: string | null;
  detection: VisitDetectionSnapshot | null;
  setInitialized: (initialized: boolean) => void;
  setPermissionStatus: (permissionStatus: LocationPermissionStatus) => void;
  setTracking: (isTracking: boolean) => void;
  setLastLocation: (lastLocation: LocationPoint | null) => void;
  setBackgroundTrackingEnabled: (backgroundTrackingEnabled: boolean) => void;
  setTrackingError: (trackingError: string | null) => void;
  setDetection: (detection: VisitDetectionSnapshot | null) => void;
  reset: () => void;
};

const initialState = {
  initialized: false,
  permissionStatus: 'unknown' as LocationPermissionStatus,
  isTracking: false,
  lastLocation: null,
  lastUpdatedAt: null,
  backgroundTrackingEnabled: false,
  trackingError: null,
  detection: null,
};

export const useLocationStore = create<LocationState>((set) => ({
  ...initialState,
  setInitialized: (initialized) => set({ initialized }),
  setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
  setTracking: (isTracking) => set({ isTracking }),
  setLastLocation: (lastLocation) => set({ lastLocation, lastUpdatedAt: lastLocation?.timestamp ?? null }),
  setBackgroundTrackingEnabled: (backgroundTrackingEnabled) => set({ backgroundTrackingEnabled }),
  setTrackingError: (trackingError) => set({ trackingError }),
  setDetection: (detection) => set({ detection }),
  reset: () => set(initialState),
}));

export type { LocationState };
