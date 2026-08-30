import { memoryRepository } from '@/repositories/memory-repository';
import { placeRepository } from '@/repositories/place-repository';
import { visitRepository } from '@/repositories/visit-repository';
import { parseAskQuery } from '@/services/ask-trace-query-parser';
import { detectTrips } from '@/services/trip-detector';
import type { AskQuery } from '@/types/ask-trace';
import type { AskTraceSearchResult } from '@/types/ask-trace-search';
import type { Memory, Place, Visit } from '@/types/trace';

const DEFAULT_LIMIT = 5;
const PHOTO_LIMIT = 20;
export type AskTraceSearchDependencies = {
  getPlaces: () => Promise<Place[]>;
  getVisits: () => Promise<Visit[]>;
  getMemories: () => Promise<Memory[]>;
};
const defaults: AskTraceSearchDependencies = { getPlaces: () => placeRepository.getPlaces(), getVisits: () => visitRepository.getVisits(), getMemories: () => memoryRepository.getMemories() };
const empty = (answerType: AskTraceSearchResult['answerType']): AskTraceSearchResult => ({ answerType, totalResults: 0, results: [] });
const withinRange = (date: string, range: AskQuery['dateRange']) => !range || (date.slice(0, 10) >= range.start && date.slice(0, 10) <= range.end);
const scoped = <T extends { userId?: string }>(items: T[], userId?: string) => userId ? items.filter(item => item.userId === userId) : items;
const textForPlace = (place: Place) => `${place.name} ${place.address ?? ''} ${place.category} ${place.kind ?? ''} ${place.resolvedCategory ?? ''}`.toLocaleLowerCase('ko-KR');

export async function searchAskTrace(query: AskQuery, userId?: string, dependencies: AskTraceSearchDependencies = defaults): Promise<AskTraceSearchResult> {
  const [rawPlaces, rawVisits, rawMemories] = await Promise.all([dependencies.getPlaces(), dependencies.getVisits(), dependencies.getMemories()]);
  const places = scoped(rawPlaces, userId); const visits = scoped(rawVisits, userId); const memories = scoped(rawMemories, userId);
  const candidatePlaces = places.filter(place => (!query.locationQuery || textForPlace(place).includes(query.locationQuery.toLocaleLowerCase('ko-KR'))) && (!query.category || place.kind?.toLocaleLowerCase() === query.category || place.resolvedCategory === query.category));
  const placeIds = new Set(candidatePlaces.map(place => place.id));
  const hasPlaceFilter = Boolean(query.locationQuery || query.category);
  const candidateVisits = visits.filter(visit => withinRange(visit.startedAt, query.dateRange) && (!hasPlaceFilter || placeIds.has(visit.placeId)));
  const candidateMemories = memories.filter(memory => withinRange(memory.startedAt, query.dateRange) && (!hasPlaceFilter || placeIds.has(memory.placeId)));
  const limit = Math.min(query.limit ?? DEFAULT_LIMIT, DEFAULT_LIMIT);

  if (query.intent === 'STATISTICS') {
    if (query.metric === 'photoCount') { const count = candidateMemories.reduce((total, memory) => total + memory.photos.length, 0); return count ? { answerType: 'statistics', totalResults: 1, results: [{ id: 'statistics-photo-count', count }] } : empty('statistics'); }
    const bases = hasPlaceFilter ? candidatePlaces : places;
    const rows = bases.map(place => ({ place, count: candidateVisits.filter(visit => visit.placeId === place.id).length, longest: Math.max(0, ...candidateVisits.filter(visit => visit.placeId === place.id).map(visit => visit.durationMinutes ?? 0)), first: candidateVisits.filter(visit => visit.placeId === place.id).sort((a,b)=>+new Date(a.startedAt)-+new Date(b.startedAt))[0]?.startedAt }))
      .filter(row => row.count > 0)
      .sort((a, b) => query.metric === 'durationMinutes' ? b.longest-a.longest : query.sort === 'oldest' ? String(a.first).localeCompare(String(b.first)) : query.metric === 'memoryCount' ? candidateMemories.filter(m => m.placeId === b.place.id).length - candidateMemories.filter(m => m.placeId === a.place.id).length : b.count - a.count)
      .slice(0, limit);
    return rows.length ? { answerType: 'statistics', totalResults: rows.length, results: rows.map(row => ({ id: row.place.id, place: row.place, count: row.count })) } : empty('statistics');
  }
  if (query.intent === 'TRIP_SEARCH') {
    const trips = detectTrips(candidateVisits, hasPlaceFilter ? candidatePlaces : places, candidateMemories).slice(0, limit);
    return trips.length ? { answerType: 'trip', totalResults: trips.length, results: trips.map(trip => ({ id: trip.id, trip, startDate: trip.startedAt, endDate: trip.endedAt, placeCount: trip.placeIds.length, photoCount: trip.memoryIds.reduce((sum, id) => sum + (candidateMemories.find(memory => memory.id === id)?.photos.length ?? 0), 0), memoryIds: trip.memoryIds })) } : empty('trip');
  }
  if (query.intent === 'PHOTO_SEARCH') {
    const results = candidateMemories.flatMap(memory => memory.photos.map(photo => ({ id: photo.id, photo, memory, place: places.find(place => place.id === memory.placeId) }))).slice(0, PHOTO_LIMIT);
    return results.length ? { answerType: 'photo', totalResults: results.length, results } : empty('photo');
  }
  if (query.intent === 'PLACE_SEARCH') {
    const results = candidatePlaces.slice(0, limit).map(place => ({ id: place.id, place, memoryIds: candidateMemories.filter(memory => memory.placeId === place.id).map(memory => memory.id) }));
    return results.length ? { answerType: 'place', totalResults: results.length, results } : empty('place');
  }
  if (query.intent === 'VISIT_SEARCH' || query.intent === 'DATE_SEARCH') {
    const results = candidateVisits.sort((a,b) => +new Date(b.startedAt) - +new Date(a.startedAt)).slice(0, limit).map(visit => ({ id: visit.id, visit, place: places.find(place => place.id === visit.placeId) }));
    return results.length ? { answerType: query.intent === 'DATE_SEARCH' ? 'date' : 'visit', totalResults: results.length, results } : empty(query.intent === 'DATE_SEARCH' ? 'date' : 'visit');
  }
  const results = candidateMemories.slice(0, limit).map(memory => ({ id: memory.id, memory, place: places.find(place => place.id === memory.placeId) }));
  return results.length ? { answerType: 'memory', totalResults: results.length, results } : empty('memory');
}

export function searchAskTraceQuestion(question: string, userId?: string, dependencies?: AskTraceSearchDependencies) { return searchAskTrace(parseAskQuery(question), userId, dependencies); }
