import { placeRepository } from '@/repositories/place-repository';
import { memoryRepository } from '@/repositories/memory-repository';
import { readEngineSnapshot } from '@/repositories/local-storage';
import { visitRepository } from '@/repositories/visit-repository';
import { processLocationPoint } from '@/services/visit-detection-service';
import { processEndedVisitMemory, recoverPendingMemoryProcessing } from '@/services/memory-processing-service';
import { useAppStore } from '@/store/app-store';
import { useLocationStore } from '@/store/location-store';
import { appendRoutePoint } from '@/services/route-recording-service';
import { useAuthStore } from '@/store/auth-store';
import { isSupabaseConfigured } from '@/services/auth-service';
import { loadCloudTraceData } from '@/services/supabase-data-service';
import { syncLocalTraceData } from '@/services/cloud-trace-sync';
import type { LocationPoint, LocationSource, VisitDetectionResult } from '@/types/location';

export async function synchronizePersistedLocationData(): Promise<void> {
  const [trackedVisits, trackedMemories] = await Promise.all([
    visitRepository.getVisits(),
    memoryRepository.getMemories(),
  ]);
  const trackedPlaces = await placeRepository.getPlaces();
  const userId = useAuthStore.getState().user?.id;
  let places = trackedPlaces;
  let visits = trackedVisits;
  let memories = trackedMemories;
  if (isSupabaseConfigured && userId && !userId.startsWith('mock-')) {
    try {
      const cloud = await loadCloudTraceData(userId);
      if (cloud) ({ places, visits, memories } = cloud);
    } catch (error) {
      // Local-first remains usable while the API is unavailable.
      console.error('Trace cloud data unavailable; retaining local records.', error);
    }
  }
  useAppStore.getState().hydrateTrackedData(places, visits, memories);
  useLocationStore.getState().setDetection(await readEngineSnapshot());
  void recoverPendingMemoryProcessing().catch((error) => {
    console.error('Trace could not recover pending Memory processing.', error);
  });
}

function synchronizeResult(point: LocationPoint, result: VisitDetectionResult): void {
  const userId = useAuthStore.getState().user?.id;
  const locationState = useLocationStore.getState();
  locationState.setLastLocation(point);
  locationState.setDetection(result.snapshot);
  locationState.setTrackingError(null);
  useAppStore.getState().setCurrentLocation({ latitude: point.latitude, longitude: point.longitude });

  if (result.matchedPlace && (result.createdVisit || result.endedVisit)) {
    useAppStore.getState().addPlace(userId ? { ...result.matchedPlace, userId } : result.matchedPlace);
  }
  if (result.createdVisit) useAppStore.getState().addVisit(userId ? { ...result.createdVisit, userId } : result.createdVisit);
  if (result.endedVisit) useAppStore.getState().updateVisit(userId ? { ...result.endedVisit, userId } : result.endedVisit);
}

export async function processAndSyncLocationPoint(
  point: LocationPoint,
  source: LocationSource,
): Promise<VisitDetectionResult> {
  try {
    void appendRoutePoint(point, source).catch((error) => console.error('Trace route point was not persisted', error));
    const result = await processLocationPoint(point, source);
    synchronizeResult(point, result);
    const userId = useAuthStore.getState().user?.id;
    if (userId && !userId.startsWith('mock-') && (result.createdVisit || result.endedVisit || result.updatedVisit)) {
      const visit = result.createdVisit ?? result.endedVisit ?? result.updatedVisit;
      if (visit) await visitRepository.updateVisit(visit.id, { userId });
      if (result.matchedPlace) await placeRepository.updatePlace(result.matchedPlace.id, { userId });
      void syncLocalTraceData(userId).catch((error) => console.error('Trace cloud sync was deferred', error));
    }
    if (result.endedVisit) {
      void processEndedVisitMemory(result.endedVisit).catch((error) => {
        console.error('Trace could not schedule Memory processing for the ended Visit.', error);
      });
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : '위치 기록을 처리하지 못했어요.';
    useLocationStore.getState().setTrackingError(message);
    console.error('Trace location pipeline failed', error);
    throw error;
  }
}
