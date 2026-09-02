import type { Coordinates, Memory, MonthlyTrace, NearbyMemory, Place, TodayTrace, Visit, YearlyTrace } from '@/types/trace';
import { distanceInMeters } from '@/utils/geo';

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function isInMonth(value: string, year: number, month: number) {
  const date = new Date(value);
  return date.getFullYear() === year && date.getMonth() + 1 === month;
}

function latestMemory(memories: Memory[], placeId: string) {
  return memories
    .filter((memory) => memory.placeId === placeId)
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0] ?? null;
}

function countVisitsByPlace(visits: Visit[]) {
  const counts = new Map<string, number>();
  visits.forEach((visit) => counts.set(visit.placeId, (counts.get(visit.placeId) ?? 0) + 1));
  return counts;
}

export function getTodayTrace(places: Place[], memories: Memory[], currentLocation: Coordinates, today = new Date()): TodayTrace | null {
  const todayMemory = memories.find((memory) => isSameDay(new Date(memory.startedAt), today));
  if (todayMemory) {
    const place = places.find((item) => item.id === todayMemory.placeId);
    if (!place) return null;
    return { place, memory: todayMemory, isNewPlace: todayMemory.visitNumber === 1, title: '오늘의 Trace', message: todayMemory.visitNumber === 1 ? '오늘 처음 발견한 장소가 있어요.' : `오늘 ${place.name}에서 새로운 순간을 남겼어요.` };
  }

  const nearest = [...places]
    .filter((place) => place.category !== 'HOME' && place.category !== 'WORK' && place.category !== 'TRANSIT')
    .sort((left, right) => distanceInMeters(currentLocation, left.location) - distanceInMeters(currentLocation, right.location))[0];
  if (!nearest) return null;
  const memory = latestMemory(memories, nearest.id);
  return {
    place: nearest,
    memory,
    isNewPlace: !memory,
    title: memory ? '오늘의 Trace' : '오늘의 새로운 장소',
    message: memory ? `오늘 ${nearest.name}을 지나갔어요. 예전에 이곳을 방문했던 기억이 있어요.` : '오늘 처음 발견한 장소가 있어요.',
  };
}

export function getOneYearAgoMemory(memories: Memory[], today = new Date()): Memory | null {
  const target = new Date(today);
  target.setFullYear(target.getFullYear() - 1);
  return memories
    .filter((memory) => isSameDay(new Date(memory.startedAt), target))
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0] ?? null;
}

export function getNearbyMemories(places: Place[], memories: Memory[], currentLocation: Coordinates, radiusMeters = 5_000): NearbyMemory[] {
  return places
    .map((place) => ({ place, latestMemory: latestMemory(memories, place.id), distanceMeters: distanceInMeters(currentLocation, place.location) }))
    .filter((item): item is NearbyMemory => Boolean(item.latestMemory) && item.distanceMeters <= radiusMeters)
    .sort((left, right) => left.distanceMeters - right.distanceMeters);
}

export function getFrequentPlaces(places: Place[], visits: Visit[], limit = 3): Place[] {
  const counts = countVisitsByPlace(visits);
  return places
    .map((place) => ({ ...place, visitCount: counts.get(place.id) ?? 0 }))
    .filter((place) => place.visitCount > 0 && place.category !== 'HOME' && place.category !== 'WORK' && place.category !== 'TRANSIT')
    .sort((left, right) => right.visitCount - left.visitCount || new Date(right.lastVisitedAt ?? 0).getTime() - new Date(left.lastVisitedAt ?? 0).getTime())
    .slice(0, limit);
}

export function getMonthlyReview(places: Place[], visits: Visit[], memories: Memory[], year: number, month: number): MonthlyTrace {
  const monthMemories = memories.filter((memory) => isInMonth(memory.startedAt, year, month));
  const monthVisits = visits.filter((visit) => isInMonth(visit.startedAt, year, month));
  const counts = countVisitsByPlace(monthVisits);
  const mostVisitedEntry = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
  const mostVisitedPlace = mostVisitedEntry ? places.find((place) => place.id === mostVisitedEntry[0]) ?? null : null;
  const representativePhotos = monthMemories.flatMap((memory) => memory.photos).filter((photo, index, all) => all.findIndex((item) => item.id === photo.id) === index).slice(0, 6);
  return {
    year,
    month,
    placeCount: new Set(monthVisits.map((visit) => visit.placeId)).size,
    memoryCount: monthMemories.length,
    photoCount: new Set(monthMemories.flatMap((memory) => memory.photos.map((photo) => photo.id))).size,
    mostVisitedPlace,
    mostVisitedCount: mostVisitedEntry?.[1] ?? 0,
    newPlaceCount: places.filter((place) => place.firstVisitedAt && isInMonth(place.firstVisitedAt, year, month)).length,
    representativePhotos,
  };
}

export function getYearlyReview(places: Place[], visits: Visit[], memories: Memory[], year: number, origin?: Coordinates): YearlyTrace {
  const yearMemories = memories.filter((memory) => new Date(memory.startedAt).getFullYear() === year);
  const yearVisits = visits.filter((visit) => new Date(visit.startedAt).getFullYear() === year);
  const months = Array.from({ length: 12 }, (_, index) => {
    const review = getMonthlyReview(places, visits, memories, year, index + 1);
    return { month: index + 1, placeCount: review.placeCount, memoryCount: review.memoryCount, photoCount: review.photoCount };
  });
  const counts = countVisitsByPlace(yearVisits);
  const mostVisitedEntry = [...counts.entries()].sort((left, right) => right[1] - left[1])[0];
  const mostVisitedPlace = mostVisitedEntry ? places.find((place) => place.id === mostVisitedEntry[0]) ?? null : null;
  const visitedPlaces = places.filter((place) => yearMemories.some((memory) => memory.placeId === place.id));
  const farthestPlace = origin ? [...visitedPlaces].sort((left, right) => distanceInMeters(origin, right.location) - distanceInMeters(origin, left.location))[0] ?? null : null;
  const activeMonth = [...months].sort((left, right) => right.memoryCount - left.memoryCount)[0];
  const regions = new Set(visitedPlaces.map((place) => place.address?.split(' ').slice(0, 2).join(' ')).filter(Boolean));
  return {
    year,
    placeCount: visitedPlaces.length,
    memoryCount: yearMemories.length,
    photoCount: new Set(yearMemories.flatMap((memory) => memory.photos.map((photo) => photo.id))).size,
    regionCount: regions.size,
    mostVisitedPlace,
    mostVisitedCount: mostVisitedEntry?.[1] ?? 0,
    farthestPlace,
    mostActiveMonth: activeMonth?.memoryCount ? activeMonth.month : null,
    months,
  };
}

export const discoveryService = { getTodayTrace, getOneYearAgoMemory, getNearbyMemories, getFrequentPlaces, getMonthlyReview, getYearlyReview };
