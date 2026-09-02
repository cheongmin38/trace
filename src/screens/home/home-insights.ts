import { getMonthlyReview } from '@/services/discovery-service';
import { deriveRegionDiscoveries } from '@/services/exploration-service';
import type { Memory, Place, Visit } from '@/types/trace';

const dayKey = (value: Date | string) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const visitDurationMinutes = (visit: Visit, now = new Date()) => {
  if (visit.durationMinutes !== undefined) return visit.durationMinutes;
  const end = visit.endedAt ? new Date(visit.endedAt) : now;
  return Math.max(0, Math.round((end.getTime() - new Date(visit.startedAt).getTime()) / 60_000));
};

function weekStart(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function selectDiscovery(memories: Memory[], now: Date) {
  const target = new Date(now);
  target.setFullYear(target.getFullYear() - 1);
  const oneYearAgo = memories.find((memory) => dayKey(memory.startedAt) === dayKey(target));
  if (oneYearAgo) return { memory: oneYearAgo, label: '1년 전 오늘' };

  const sameDate = memories.filter((memory) => {
    const date = new Date(memory.startedAt);
    return date.getMonth() === now.getMonth() && date.getDate() === now.getDate() && date.getFullYear() < now.getFullYear();
  }).sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0];
  if (sameDate) return { memory: sameDate, label: '오늘의 지난 기억' };

  const oldMemories = memories.filter((memory) => now.getTime() - new Date(memory.startedAt).getTime() >= 60 * 24 * 60 * 60 * 1000);
  const favorite = oldMemories.find((memory) => memory.isFavorite);
  if (favorite) return { memory: favorite, label: '다시 발견한 기억' };
  if (!oldMemories.length) return null;
  const rotation = Math.floor(now.getTime() / 86_400_000) % oldMemories.length;
  return { memory: oldMemories[rotation], label: '다시 발견한 기억' };
}

export function buildHomeInsights({ places, visits, memories, now = new Date() }: { places: Place[]; visits: Visit[]; memories: Memory[]; now?: Date }) {
  const today = dayKey(now);
  const orderedVisits = [...visits].sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime());
  const todayVisits = orderedVisits.filter((visit) => dayKey(visit.startedAt) === today).sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime());
  const todayVisitIds = new Set(todayVisits.map((visit) => visit.id));
  const todayMemories = memories.filter((memory) => todayVisitIds.has(memory.visitId));
  const todayPhotoCount = new Set(todayMemories.flatMap((memory) => memory.photos.map((photo) => photo.id))).size;
  const start = weekStart(now);
  const weekVisits = visits.filter((visit) => new Date(visit.startedAt) >= start && new Date(visit.startedAt) <= now);
  const weekVisitIds = new Set(weekVisits.map((visit) => visit.id));
  const weekMemories = memories.filter((memory) => weekVisitIds.has(memory.visitId));
  const longestVisit = [...weekVisits].sort((left, right) => visitDurationMinutes(right, now) - visitDurationMinutes(left, now))[0] ?? null;
  const monthly = getMonthlyReview(places, visits, memories, now.getFullYear(), now.getMonth() + 1);
  const exploration = deriveRegionDiscoveries(places, visits);
  const exploredPlaceCount = new Set(visits.map((visit) => visit.placeId)).size;
  const newlyExploredRegionCount = exploration.filter((region) => new Date(region.firstVisitedAt).getFullYear() === now.getFullYear()).length;

  return {
    todayKey: today,
    todayVisits,
    todayPlaceCount: new Set(todayVisits.map((visit) => visit.placeId)).size,
    todayPhotoCount,
    todayDurationMinutes: todayVisits.reduce((total, visit) => total + visitDurationMinutes(visit, now), 0),
    recentMemories: [...memories].sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()).slice(0, 5),
    discovery: selectDiscovery([...memories].sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()), now),
    weekly: {
      visitCount: weekVisits.length,
      placeCount: new Set(weekVisits.map((visit) => visit.placeId)).size,
      photoCount: new Set(weekMemories.flatMap((memory) => memory.photos.map((photo) => photo.id))).size,
      newPlaceCount: places.filter((place) => place.firstVisitedAt && new Date(place.firstVisitedAt) >= start && new Date(place.firstVisitedAt) <= now).length,
      durationMinutes: weekVisits.reduce((total, visit) => total + visitDurationMinutes(visit, now), 0),
      longestVisit,
    },
    monthly,
    exploration,
    exploredPlaceCount,
    newlyExploredRegionCount,
  };
}
