import type { AppSettings, Memory, Place, UserStats, Visit } from '@/types/trace';

export function deriveUserStats(places: Place[], memories: Memory[], visits: Visit[] = []): UserStats {
  const photoIds = new Set(memories.flatMap((memory) => memory.photos.map((photo) => photo.id)));
  const regions = new Set(places.map((place) => place.address?.split(' ').slice(0, 2).join(' ')).filter(Boolean));
  return { placeCount: places.length, visitCount: visits.length, memoryCount: memories.length, photoCount: photoIds.size, regionCount: regions.size };
}

export function getPlaceById(places: Place[], placeId: string): Place | null {
  return places.find((place) => place.id === placeId) ?? null;
}

export function getVisitById(visits: Visit[], visitId: string): Visit | null {
  return visits.find((visit) => visit.id === visitId) ?? null;
}

export function getLatestMemoryForPlace(memories: Memory[], placeId: string): Memory | null {
  return memories
    .filter((memory) => memory.placeId === placeId)
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0] ?? null;
}

export function isMemoryVisible(memory: Memory, place: Place | null, settings: AppSettings): boolean {
  if (!place) return false;
  if (place.category === 'TRANSIT') return false;
  if (place.category === 'HOME' && !settings.showHomeMemories) return false;
  if (place.category === 'WORK' && !settings.showWorkMemories) return false;
  return true;
}
