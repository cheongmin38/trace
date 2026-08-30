import type { Visit } from '@/types/trace';

type VisitIdentity = Pick<Visit, 'id' | 'placeId' | 'startedAt'>;

export function calculateVisitNumber(visits: VisitIdentity[], target: VisitIdentity): number {
  const chronological = visits
    .filter((visit) => visit.placeId === target.placeId)
    .sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime());
  const index = chronological.findIndex((visit) => visit.id === target.id);
  return index >= 0 ? index + 1 : chronological.filter((visit) => new Date(visit.startedAt) <= new Date(target.startedAt)).length + 1;
}

export function getNextVisitNumber(visits: VisitIdentity[], placeId: string): number {
  return visits.filter((visit) => visit.placeId === placeId).length + 1;
}
