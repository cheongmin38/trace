import { memoryRepository } from '@/repositories/memory-repository';
import { placeRepository } from '@/repositories/place-repository';
import { visitRepository } from '@/repositories/visit-repository';
import { createMemoryFromVisit } from '@/services/memory-engine';
import { photoService, PhotoServiceError, type PhotoService } from '@/services/photo-service';
import { useAppStore } from '@/store/app-store';
import type { Memory, Visit } from '@/types/trace';
import { useAuthStore } from '@/store/auth-store';
import { syncLocalTraceData } from '@/services/cloud-trace-sync';

export type MemoryProcessingOutcome = {
  status: 'completed' | 'noPhotos' | 'failed' | 'skipped';
  visit: Visit | null;
  memory: Memory | null;
};

const inFlight = new Map<string, Promise<MemoryProcessingOutcome>>();

function debug(message: string, details?: unknown): void {
  if (__DEV__) console.info(`[Trace memory] ${message}`, details ?? '');
}

function syncToAppStore(visit: Visit | null, memory: Memory | null): void {
  if (visit) useAppStore.getState().updateVisit(visit);
  if (memory) useAppStore.getState().addMemory(memory);
}

async function processClaimedVisit(visit: Visit, syncStore: boolean): Promise<MemoryProcessingOutcome> {
  const now = new Date().toISOString();
  try {
    const existingMemory = await memoryRepository.getMemoryByVisitId(visit.id);
    if (existingMemory) {
      const completedVisit = await visitRepository.finishMemoryProcessing(visit.id, 'completed', now, existingMemory.id);
      if (syncStore) syncToAppStore(completedVisit, existingMemory);
      return { status: 'completed', visit: completedVisit, memory: existingMemory };
    }

    const [place, visits, assignedPhotoIds] = await Promise.all([
      placeRepository.getPlaceById(visit.placeId),
      visitRepository.getVisits(),
      memoryRepository.getAssignedPhotoIds(visit.id),
    ]);
    const visitPhotoService: PhotoService = visit.source === 'mock'
      ? {
        getPhotos: async () => visit.mockPhotos ?? [],
        getPhotosBetween: async () => visit.mockPhotos ?? [],
        searchPhotosBetween: async () => ({ photos: visit.mockPhotos ?? [], access: 'all', isComplete: true }),
      }
      : photoService;
    const memory = await createMemoryFromVisit(visit, {
      photoService: visitPhotoService,
      getPlace: () => place,
      getVisits: () => visits,
      getMemoryByVisitId: () => null,
      getAssignedPhotoIds: () => assignedPhotoIds,
      includeScreenshots: useAppStore.getState().settings.includeScreenshotsInMemories,
    });

    if (!memory) {
      const noPhotosVisit = await visitRepository.finishMemoryProcessing(visit.id, 'noPhotos', now);
      if (syncStore) syncToAppStore(noPhotosVisit, null);
      debug('No matching photos; Visit retained without Memory.', { visitId: visit.id });
      return { status: 'noPhotos', visit: noPhotosVisit, memory: null };
    }

    const userId = useAuthStore.getState().user?.id;
    const persistedMemory = await memoryRepository.createMemory(userId && !userId.startsWith('mock-') ? { ...memory, userId } : memory);
    if (!persistedMemory) {
      const noUniquePhotosVisit = await visitRepository.finishMemoryProcessing(
        visit.id,
        'noPhotos',
        new Date().toISOString(),
        undefined,
        'noUniquePhotos',
      );
      if (syncStore) syncToAppStore(noUniquePhotosVisit, null);
      debug('All matching photos already belong to another Memory.', { visitId: visit.id });
      return { status: 'noPhotos', visit: noUniquePhotosVisit, memory: null };
    }
    const completedVisit = await visitRepository.finishMemoryProcessing(
      visit.id,
      'completed',
      new Date().toISOString(),
      persistedMemory.id,
    );
    if (syncStore) syncToAppStore(completedVisit, persistedMemory);
    if (userId && !userId.startsWith('mock-')) void syncLocalTraceData(userId).catch((error) => console.error('Trace Memory cloud sync was deferred', error));
    debug('Memory created from ended Visit.', { visitId: visit.id, memoryId: persistedMemory.id });
    return { status: 'completed', visit: completedVisit, memory: persistedMemory };
  } catch (error) {
    const errorCode = error instanceof PhotoServiceError
      ? {
        'permission-denied': 'photoPermissionDenied',
        'permission-limited': 'photoPermissionLimited',
        'library-unavailable': 'libraryUnavailable',
      }[error.code] as Visit['memoryProcessingError']
      : 'libraryUnavailable';
    const failedVisit = await visitRepository.finishMemoryProcessing(
      visit.id,
      'failed',
      new Date().toISOString(),
      undefined,
      errorCode,
    );
    if (syncStore) syncToAppStore(failedVisit, null);
    console.error('Trace Memory processing failed; the Visit remains safely stored.', error);
    return { status: 'failed', visit: failedVisit, memory: null };
  }
}

export function processEndedVisitMemory(
  visit: Visit,
  options: { syncStore?: boolean } = {},
): Promise<MemoryProcessingOutcome> {
  const running = inFlight.get(visit.id);
  if (running) return running;

  const operation = (async () => {
    if (!visit.endedAt) return { status: 'skipped', visit, memory: null } as const;

    const existingMemory = await memoryRepository.getMemoryByVisitId(visit.id);
    if (visit.memoryIds?.length || existingMemory) {
      const completedVisit = await visitRepository.finishMemoryProcessing(
        visit.id,
        'completed',
        new Date().toISOString(),
        existingMemory?.id ?? visit.memoryIds?.[0],
      );
      if (options.syncStore !== false) syncToAppStore(completedVisit, existingMemory);
      return { status: 'completed', visit: completedVisit, memory: existingMemory } as const;
    }

    const claimed = await visitRepository.claimMemoryProcessing(visit.id, new Date().toISOString());
    if (!claimed) {
      const latest = await visitRepository.getVisitById(visit.id);
      return { status: 'skipped', visit: latest, memory: null } as const;
    }
    return processClaimedVisit(claimed, options.syncStore !== false);
  })().finally(() => inFlight.delete(visit.id));

  inFlight.set(visit.id, operation);
  return operation;
}

export async function recoverPendingMemoryProcessing(options: { syncStore?: boolean } = {}): Promise<void> {
  const visits = await visitRepository.getVisits();
  const pending = visits.filter((visit) => visit.endedAt
    && !visit.memoryIds?.length
    && visit.memoryProcessingStatus !== 'completed'
    && visit.memoryProcessingStatus !== 'noPhotos');
  for (const visit of pending) {
    await processEndedVisitMemory(visit, options);
  }
}
