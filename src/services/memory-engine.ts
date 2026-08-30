import { matchPhotosToVisit } from '@/services/photo-matcher';
import { photoService, PhotoServiceError, type PhotoService } from '@/services/photo-service';
import { useAppStore } from '@/store/app-store';
import type { Memory, Place, Visit } from '@/types/trace';
import { calculateVisitNumber } from '@/utils/visit-number';

export type MemoryEngineDependencies = {
  photoService: PhotoService;
  getPlace: (placeId: string) => Place | null;
  getVisits: () => Visit[];
  getMemoryByVisitId?: (visitId: string) => Memory | null;
  getAssignedPhotoIds?: (visitId: string) => ReadonlySet<string>;
  includeScreenshots?: boolean;
  saveVisit?: (visit: Visit) => Visit;
  saveMemory?: (memory: Memory) => void;
};

function defaultDependencies(): MemoryEngineDependencies {
  return {
    photoService,
    getPlace: (placeId) => useAppStore.getState().places.find((place) => place.id === placeId) ?? null,
    getVisits: () => useAppStore.getState().visits,
    getMemoryByVisitId: (visitId) => useAppStore.getState().memories.find((memory) => memory.visitId === visitId) ?? null,
    getAssignedPhotoIds: (visitId) => new Set(
      useAppStore.getState().memories
        .filter((memory) => memory.visitId !== visitId)
        .flatMap((memory) => memory.photos.map((photo) => photo.assetId ?? photo.id)),
    ),
    includeScreenshots: useAppStore.getState().settings.includeScreenshotsInMemories,
    saveVisit: (visit) => useAppStore.getState().addVisit(visit),
    saveMemory: (memory) => useAppStore.getState().addMemory(memory),
  };
}

export async function createMemoryFromVisit(
  visit: Visit,
  dependencies: MemoryEngineDependencies = defaultDependencies(),
): Promise<Memory | null> {
  const existing = dependencies.getMemoryByVisitId?.(visit.id);
  if (existing) return existing;
  const place = dependencies.getPlace(visit.placeId);
  if (!place || place.category === 'TRANSIT' || !visit.endedAt) return null;
  const normalizedVisit = dependencies.saveVisit?.(visit) ?? visit;
  if (!normalizedVisit.endedAt) return null;

  const queryStart = new Date(new Date(normalizedVisit.startedAt).getTime() - 10 * 60_000).toISOString();
  const queryEnd = new Date(new Date(normalizedVisit.endedAt).getTime() + 10 * 60_000).toISOString();
  const search = await dependencies.photoService.searchPhotosBetween(queryStart, queryEnd);
  const photos = matchPhotosToVisit(normalizedVisit, place, search.photos, {
    excludedPhotoIds: dependencies.getAssignedPhotoIds?.(normalizedVisit.id) ?? new Set<string>(),
    includeScreenshots: dependencies.includeScreenshots ?? false,
  });

  if (!photos.length) {
    if (!search.isComplete && search.access === 'limited') {
      throw new PhotoServiceError(
        'permission-limited',
        '선택한 사진만 접근할 수 있어 이 방문의 사진을 모두 확인하지 못했습니다.',
      );
    }
    return null;
  }

  const visitNumber = calculateVisitNumber(dependencies.getVisits(), normalizedVisit);
  const memory: Memory = {
    id: `memory-${normalizedVisit.id}`,
    userId: normalizedVisit.userId,
    placeId: place.id,
    visitId: normalizedVisit.id,
    title: place.name,
    visitNumber,
    startedAt: normalizedVisit.startedAt,
    endedAt: normalizedVisit.endedAt,
    photos,
    coverPhotoId: photos[0]?.id,
    excludedPhotoIds: [],
    location: normalizedVisit.location,
    summary: `${place.name}에서 보낸 ${normalizedVisit.durationMinutes ?? 0}분의 시간이 기록되었어요.`,
    createdAt: new Date().toISOString(),
    isFavorite: false,
  };
  dependencies.saveMemory?.(memory);
  return memory;
}
