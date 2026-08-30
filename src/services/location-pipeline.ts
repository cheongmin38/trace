import { placeRepository } from '@/repositories/place-repository';
import { memoryRepository } from '@/repositories/memory-repository';
import { readEngineSnapshot } from '@/repositories/local-storage';
import { visitRepository } from '@/repositories/visit-repository';
import { processLocationPoint } from '@/services/visit-detection-service';
import { processEndedVisitMemory, recoverPendingMemoryProcessing } from '@/services/memory-processing-service';
import { useAppStore } from '@/store/app-store';
import { useLocationStore } from '@/store/location-store';
import { appendRoutePoint } from '@/services/route-recording-service';
import type { LocationPoint, LocationSource, VisitDetectionResult } from '@/types/location';

export async function synchronizePersistedLocationData(): Promise<void> {
  const [trackedVisits, trackedMemories] = await Promise.all([
    visitRepository.getVisits(),
    memoryRepository.getMemories(),
  ]);
  const trackedPlaces = await placeRepository.getPlaces();
  useAppStore.getState().hydrateTrackedData(trackedPlaces, trackedVisits, trackedMemories);
  useLocationStore.getState().setDetection(await readEngineSnapshot());
  void recoverPendingMemoryProcessing().catch((error) => {
    console.error('Trace could not recover pending Memory processing.', error);
  });
}

function synchronizeResult(point: LocationPoint, result: VisitDetectionResult): void {
  const locationState = useLocationStore.getState();
  locationState.setLastLocation(point);
  locationState.setDetection(result.snapshot);
  locationState.setTrackingError(null);
  useAppStore.getState().setCurrentLocation({ latitude: point.latitude, longitude: point.longitude });

  if (result.matchedPlace && (result.createdVisit || result.endedVisit)) {
    useAppStore.getState().addPlace(result.matchedPlace);
  }
  if (result.createdVisit) useAppStore.getState().addVisit(result.createdVisit);
  if (result.endedVisit) useAppStore.getState().updateVisit(result.endedVisit);
}

export async function processAndSyncLocationPoint(
  point: LocationPoint,
  source: LocationSource,
): Promise<VisitDetectionResult> {
  try {
    void appendRoutePoint(point, source).catch((error) => console.error('Trace route point was not persisted', error));
    const result = await processLocationPoint(point, source);
    synchronizeResult(point, result);
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
