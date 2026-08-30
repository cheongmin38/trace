import { Linking, Platform } from 'react-native';
import { readTrackingPreferences, writeTrackingError, writeTrackingPreferences } from '@/repositories/local-storage';
import { processAndSyncLocationPoint, synchronizePersistedLocationData } from '@/services/location-pipeline';
import { useAppStore } from '@/store/app-store';
import { useLocationStore } from '@/store/location-store';
import { TRACE_LOCATION_TASK } from '@/tasks/location-task-name';
import type { LocationPermissionStatus, LocationPoint } from '@/types/location';
import type { Coordinates } from '@/types/trace';

export const SEOUL_FALLBACK: Coordinates = { latitude: 37.5444, longitude: 127.0374 };

export interface LocationService {
  requestForegroundPermission(): Promise<LocationPermissionStatus>;
  requestBackgroundPermission(): Promise<LocationPermissionStatus>;
  getCurrentLocation(): Promise<LocationPoint | null>;
  startLocationTracking(options?: { backgroundPreferred?: boolean; requestPermission?: boolean }): Promise<LocationPoint | null>;
  stopLocationTracking(): Promise<void>;
  getLocationPermissionStatus(): Promise<LocationPermissionStatus>;
}

type LocationModule = typeof import('expo-location');
type LocationSubscription = Awaited<ReturnType<LocationModule['watchPositionAsync']>>;

let foregroundSubscription: LocationSubscription | null = null;
let lastForegroundProcessedAt = 0;

async function loadLocationModule(): Promise<LocationModule> {
  return import('expo-location');
}

async function loadTaskManager() {
  return import('expo-task-manager');
}

function toPoint(location: { timestamp: number; coords: { latitude: number; longitude: number; accuracy: number | null; altitude: number | null; speed: number | null; heading: number | null } }): LocationPoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? undefined,
    altitude: location.coords.altitude ?? undefined,
    speed: location.coords.speed ?? undefined,
    heading: location.coords.heading ?? undefined,
    timestamp: new Date(location.timestamp).toISOString(),
  };
}

function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('permission')) return '위치 권한이 필요해요. 설정에서 위치 접근을 허용해주세요.';
  if (message.includes('provider') || message.includes('unavailable')) return '기기의 위치 서비스를 확인해주세요.';
  return '위치 기록을 시작하지 못했어요. 잠시 후 다시 시도해주세요.';
}

function mapPermission(
  foreground: { granted: boolean; canAskAgain: boolean },
  background?: { granted: boolean },
): LocationPermissionStatus {
  if (background?.granted) return 'background-granted';
  if (foreground.granted) return 'foreground-granted';
  return foreground.canAskAgain ? 'denied' : 'restricted';
}

export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    const Location = await loadLocationModule();
    const [foreground, background] = await Promise.all([
      Location.getForegroundPermissionsAsync(),
      Location.getBackgroundPermissionsAsync(),
    ]);
    return mapPermission(foreground, background);
  } catch (error) {
    console.error('Unable to read location permission status', error);
    return 'unknown';
  }
}

export async function requestForegroundPermission(): Promise<LocationPermissionStatus> {
  if (Platform.OS === 'web') {
    useLocationStore.getState().setPermissionStatus('unsupported');
    return 'unsupported';
  }
  try {
    const response = await (await loadLocationModule()).requestForegroundPermissionsAsync();
    const status = mapPermission(response);
    useLocationStore.getState().setPermissionStatus(status);
    return status;
  } catch (error) {
    const message = friendlyError(error);
    useLocationStore.getState().setTrackingError(message);
    console.error('Foreground location permission request failed', error);
    return 'denied';
  }
}

export async function requestBackgroundPermission(): Promise<LocationPermissionStatus> {
  if (Platform.OS === 'web') {
    useLocationStore.getState().setPermissionStatus('unsupported');
    return 'unsupported';
  }
  const foreground = await requestForegroundPermission();
  if (foreground !== 'foreground-granted' && foreground !== 'background-granted') return foreground;
  try {
    const response = await (await loadLocationModule()).requestBackgroundPermissionsAsync();
    const status: LocationPermissionStatus = response.granted ? 'background-granted' : 'foreground-granted';
    useLocationStore.getState().setPermissionStatus(status);
    return status;
  } catch (error) {
    const message = friendlyError(error);
    useLocationStore.getState().setTrackingError(message);
    console.error('Background location permission request failed', error);
    return 'foreground-granted';
  }
}

export async function getCurrentLocation(): Promise<LocationPoint | null> {
  if (Platform.OS === 'web') {
    return { ...SEOUL_FALLBACK, accuracy: 15, speed: 0, timestamp: new Date().toISOString() };
  }
  const Location = await loadLocationModule();
  if (!(await Location.hasServicesEnabledAsync())) throw new Error('Location provider unavailable');
  const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return toPoint(location);
}

async function registerBackgroundUpdates(Location: LocationModule): Promise<boolean> {
  const TaskManager = await loadTaskManager();
  if (!(await TaskManager.isAvailableAsync())) return false;
  if (await Location.hasStartedLocationUpdatesAsync(TRACE_LOCATION_TASK)) return true;
  await Location.startLocationUpdatesAsync(TRACE_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 50,
    timeInterval: 60_000,
    deferredUpdatesDistance: 50,
    deferredUpdatesInterval: 60_000,
    pausesUpdatesAutomatically: true,
    activityType: Location.ActivityType.Other,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Trace 위치 기록',
      notificationBody: '방문한 장소를 기기 안에서 조용히 기록하고 있어요.',
      killServiceOnDestroy: false,
    },
  });
  return true;
}

async function registerForegroundUpdates(Location: LocationModule): Promise<void> {
  foregroundSubscription?.remove();
  foregroundSubscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 30_000 },
    (location) => {
      if (location.timestamp - lastForegroundProcessedAt < 10_000) return;
      lastForegroundProcessedAt = location.timestamp;
      void processAndSyncLocationPoint(toPoint(location), 'gps').catch(() => undefined);
    },
    (reason) => useLocationStore.getState().setTrackingError(reason),
  );
}

export async function startLocationTracking(
  options: { backgroundPreferred?: boolean; requestPermission?: boolean } = {},
): Promise<LocationPoint | null> {
  const { backgroundPreferred = useLocationStore.getState().backgroundTrackingEnabled, requestPermission = true } = options;
  if (Platform.OS === 'web') {
    const point = await getCurrentLocation();
    useLocationStore.getState().setTracking(true);
    useLocationStore.getState().setLastLocation(point);
    if (point) useAppStore.getState().setCurrentLocation(point);
    await writeTrackingPreferences({ trackingEnabled: true, backgroundTrackingEnabled: false });
    return point;
  }

  try {
    let permission = await getLocationPermissionStatus();
    if (requestPermission && permission !== 'foreground-granted' && permission !== 'background-granted') {
      permission = await requestForegroundPermission();
    }
    if (permission !== 'foreground-granted' && permission !== 'background-granted') {
      throw new Error('Location permission denied');
    }
    const Location = await loadLocationModule();
    let backgroundRegistered = false;
    if (backgroundPreferred && permission === 'background-granted') {
      backgroundRegistered = await registerBackgroundUpdates(Location);
    }
    await registerForegroundUpdates(Location);
    const point = await getCurrentLocation();
    if (point) await processAndSyncLocationPoint(point, 'gps');
    useLocationStore.getState().setTracking(true);
    useLocationStore.getState().setBackgroundTrackingEnabled(backgroundRegistered);
    useLocationStore.getState().setTrackingError(null);
    await writeTrackingError(null);
    await writeTrackingPreferences({ trackingEnabled: true, backgroundTrackingEnabled: backgroundRegistered });
    return point;
  } catch (error) {
    const message = friendlyError(error);
    useLocationStore.getState().setTracking(false);
    useLocationStore.getState().setTrackingError(message);
    await writeTrackingError(message);
    console.error('Location tracking could not be started', error);
    throw new Error(message);
  }
}

export async function stopLocationTracking(): Promise<void> {
  foregroundSubscription?.remove();
  foregroundSubscription = null;
  if (Platform.OS !== 'web') {
    try {
      const Location = await loadLocationModule();
      if (await Location.hasStartedLocationUpdatesAsync(TRACE_LOCATION_TASK)) {
        await Location.stopLocationUpdatesAsync(TRACE_LOCATION_TASK);
      }
    } catch (error) {
      console.error('Location tracking could not be stopped cleanly', error);
    }
  }
  useLocationStore.getState().setTracking(false);
  useLocationStore.getState().setBackgroundTrackingEnabled(false);
  await writeTrackingPreferences({ trackingEnabled: false, backgroundTrackingEnabled: false });
}

export async function restoreLocationTracking(): Promise<void> {
  const locationStore = useLocationStore.getState();
  try {
    await synchronizePersistedLocationData();
    const preferences = await readTrackingPreferences();
    const permissionStatus = await getLocationPermissionStatus();
    locationStore.setPermissionStatus(permissionStatus);
    locationStore.setBackgroundTrackingEnabled(preferences.backgroundTrackingEnabled);
    if (preferences.trackingEnabled) {
      if (Platform.OS === 'web') locationStore.setTracking(true);
      else if (permissionStatus === 'foreground-granted' || permissionStatus === 'background-granted') {
        await startLocationTracking({
          backgroundPreferred: preferences.backgroundTrackingEnabled,
          requestPermission: false,
        });
      }
    }
  } catch (error) {
    const message = friendlyError(error);
    locationStore.setTrackingError(message);
    console.error('Location state restore failed', error);
  } finally {
    locationStore.setInitialized(true);
  }
}

export async function setBackgroundTrackingEnabled(enabled: boolean): Promise<LocationPermissionStatus> {
  if (!enabled) {
    useLocationStore.getState().setBackgroundTrackingEnabled(false);
    const preferences = await readTrackingPreferences();
    await writeTrackingPreferences({ ...preferences, backgroundTrackingEnabled: false });
    return getLocationPermissionStatus();
  }
  const status = await requestBackgroundPermission();
  if (status === 'background-granted') {
    useLocationStore.getState().setBackgroundTrackingEnabled(true);
    if (useLocationStore.getState().isTracking) await startLocationTracking({ backgroundPreferred: true });
  }
  return status;
}

export async function openLocationSettings(): Promise<void> {
  await Linking.openSettings();
}

export async function requestLocationPermission(): Promise<boolean> {
  const status = await requestForegroundPermission();
  return status === 'foreground-granted' || status === 'background-granted';
}

export const locationService: LocationService = {
  requestForegroundPermission,
  requestBackgroundPermission,
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
  getLocationPermissionStatus,
};
