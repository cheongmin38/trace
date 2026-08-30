import type { Memory, Place, Trip, Visit } from '@/types/trace';
import { distanceInMeters } from '@/utils/geo';

export type TripDetectorOptions = {
  maximumGapHours: number;
  minimumTripHours: number;
  minimumMovementMeters: number;
  minimumPlaces: number;
};

const defaults: TripDetectorOptions = { maximumGapHours: 36, minimumTripHours: 24, minimumMovementMeters: 5_000, minimumPlaces: 2 };

function tripTitle(places: Place[]) {
  const regions = new Set(places.map((place) => place.address?.split(' ')[0]).filter(Boolean));
  if ([...regions].some((region) => region?.includes('부산'))) return '부산 여행';
  if ([...regions].some((region) => region?.includes('제주'))) return '제주 여행';
  if ([...regions].some((region) => region?.includes('경기') || region?.includes('강원'))) return '서울 근교 여행';
  return `${[...regions][0] ?? '새로운 지역'} 여행`;
}

function buildTrip(group: Visit[], placesById: Map<string, Place>, memories: Memory[], options: TripDetectorOptions): Trip | null {
  if (group.length < 2) return null;
  const placeIds = [...new Set(group.map((visit) => visit.placeId))];
  if (placeIds.length < options.minimumPlaces) return null;
  const startedAt = group[0].startedAt;
  const endedAt = group.at(-1)!.endedAt ?? group.at(-1)!.startedAt;
  const hours = (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 3_600_000;
  if (hours < options.minimumTripHours) return null;
  const places = placeIds.map((id) => placesById.get(id)).filter((place): place is Place => Boolean(place));
  const movement = places.reduce((maximum, place, index) => Math.max(maximum, ...places.slice(index + 1).map((other) => distanceInMeters(place.location, other.location)), 0), 0);
  if (movement < options.minimumMovementMeters) return null;
  const visitIds = new Set(group.map((visit) => visit.id));
  const tripMemories = memories.filter((memory) => visitIds.has(memory.visitId)).sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime());
  return { id: `trip-${new Date(startedAt).getTime()}`, title: tripTitle(places), startedAt, endedAt, placeIds, memoryIds: tripMemories.map((memory) => memory.id), coverPhoto: tripMemories.flatMap((memory) => memory.photos)[0] };
}

export function detectTrips(visits: Visit[], places: Place[], memories: Memory[], overrides: Partial<TripDetectorOptions> = {}): Trip[] {
  const options = { ...defaults, ...overrides };
  const placesById = new Map(places.map((place) => [place.id, place]));
  const eligible = visits
    .filter((visit) => {
      const category = placesById.get(visit.placeId)?.category;
      return category !== 'HOME' && category !== 'WORK' && category !== 'TRANSIT' && category !== 'UNKNOWN';
    })
    .sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime());
  const groups: Visit[][] = [];
  let group: Visit[] = [];
  eligible.forEach((visit) => {
    const previous = group.at(-1);
    const gapHours = previous ? (new Date(visit.startedAt).getTime() - new Date(previous.endedAt ?? previous.startedAt).getTime()) / 3_600_000 : 0;
    if (previous && gapHours > options.maximumGapHours) {
      groups.push(group);
      group = [];
    }
    group.push(visit);
  });
  if (group.length) groups.push(group);
  return groups.map((visitsInTrip) => buildTrip(visitsInTrip, placesById, memories, options)).filter((trip): trip is Trip => Boolean(trip));
}
