import { readPersistedVisits, writePersistedVisits } from '@/repositories/local-storage';
import type { Visit } from '@/types/trace';
import { minutesBetween } from '@/utils/time';

export interface VisitRepository {
  getVisits(): Promise<Visit[]>;
  getVisitById(id: string): Promise<Visit | null>;
  getActiveVisit(): Promise<Visit | null>;
  getVisitsByPlaceId(placeId: string): Promise<Visit[]>;
  createVisit(visit: Visit): Promise<Visit>;
  updateVisit(id: string, values: Partial<Omit<Visit, 'id'>>): Promise<Visit | null>;
  deleteVisit(id: string): Promise<Visit | null>;
  endVisit(id: string, endedAt: string): Promise<Visit | null>;
  claimMemoryProcessing(id: string, timestamp: string): Promise<Visit | null>;
  finishMemoryProcessing(
    id: string,
    status: 'completed' | 'noPhotos' | 'failed',
    timestamp: string,
    memoryId?: string,
    errorCode?: Visit['memoryProcessingError'],
  ): Promise<Visit | null>;
  getVisitCountForPlace(placeId: string): Promise<number>;
}

let mutationQueue: Promise<void> = Promise.resolve();
const PROCESSING_LEASE_MS = 2 * 60_000;

async function enqueueMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(operation, operation);
  mutationQueue = result.then(() => undefined, () => undefined);
  return result;
}

class LocalVisitRepository implements VisitRepository {
  async getVisits(): Promise<Visit[]> {
    return (await readPersistedVisits()).sort(
      (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    );
  }

  async getVisitById(id: string): Promise<Visit | null> {
    return (await this.getVisits()).find((visit) => visit.id === id) ?? null;
  }

  async getActiveVisit(): Promise<Visit | null> {
    return (await this.getVisits()).find((visit) => !visit.endedAt) ?? null;
  }

  async getVisitsByPlaceId(placeId: string): Promise<Visit[]> {
    return (await this.getVisits()).filter((visit) => visit.placeId === placeId);
  }

  async createVisit(visit: Visit): Promise<Visit> {
    return enqueueMutation(async () => {
      const visits = await readPersistedVisits();
      const existing = visits.find((item) => item.id === visit.id);
      if (existing) return existing;
      const samePlace = visits.filter((item) => item.placeId === visit.placeId);
      const normalized = { ...visit, visitNumber: samePlace.length + 1 };
      await writePersistedVisits([...visits, normalized]);
      return normalized;
    });
  }

  async updateVisit(id: string, values: Partial<Omit<Visit, 'id'>>): Promise<Visit | null> {
    return enqueueMutation(async () => {
      const visits = await readPersistedVisits();
      const current = visits.find((visit) => visit.id === id);
      if (!current) return null;
      const updated: Visit = { ...current, ...values, id, location: values.location ?? current.location };
      const next = visits.map((visit) => visit.id === id ? updated : visit);
      const affected = new Set([current.placeId, updated.placeId]);
      for (const placeId of affected) {
        next.filter(v => v.placeId === placeId).sort((a,b)=>new Date(a.startedAt).getTime()-new Date(b.startedAt).getTime()).forEach((v,i)=>{ v.visitNumber=i+1; });
      }
      await writePersistedVisits(next);
      return next.find(v=>v.id===id) ?? updated;
    });
  }

  async deleteVisit(id: string): Promise<Visit | null> {
    return enqueueMutation(async () => {
      const visits = await readPersistedVisits();
      const removed = visits.find(v => v.id === id) ?? null;
      if (removed) await writePersistedVisits(visits.filter(v => v.id !== id));
      return removed;
    });
  }

  async endVisit(id: string, endedAt: string): Promise<Visit | null> {
    const visit = await this.getVisitById(id);
    if (!visit) return null;
    return this.updateVisit(id, {
      endedAt,
      durationMinutes: minutesBetween(visit.startedAt, endedAt),
      memoryProcessingStatus: visit.memoryIds?.length ? 'completed' : 'pending',
      memoryProcessingUpdatedAt: endedAt,
      memoryProcessingError: undefined,
    });
  }

  async claimMemoryProcessing(id: string, timestamp: string): Promise<Visit | null> {
    return enqueueMutation(async () => {
      const visits = await readPersistedVisits();
      const current = visits.find((visit) => visit.id === id);
      if (!current?.endedAt || current.memoryIds?.length) return null;
      if (current.memoryProcessingStatus === 'completed' || current.memoryProcessingStatus === 'noPhotos') return null;
      const processingAt = current.memoryProcessingUpdatedAt
        ? new Date(current.memoryProcessingUpdatedAt).getTime()
        : 0;
      const requestedAt = new Date(timestamp).getTime();
      if (current.memoryProcessingStatus === 'processing'
        && Number.isFinite(processingAt)
        && Number.isFinite(requestedAt)
        && requestedAt - processingAt < PROCESSING_LEASE_MS) return null;
      const claimed: Visit = {
        ...current,
        memoryProcessingStatus: 'processing',
        memoryProcessingUpdatedAt: timestamp,
        memoryProcessingError: undefined,
      };
      await writePersistedVisits(visits.map((visit) => visit.id === id ? claimed : visit));
      return claimed;
    });
  }

  async finishMemoryProcessing(
    id: string,
    status: 'completed' | 'noPhotos' | 'failed',
    timestamp: string,
    memoryId?: string,
    errorCode?: Visit['memoryProcessingError'],
  ): Promise<Visit | null> {
    return enqueueMutation(async () => {
      const visits = await readPersistedVisits();
      const current = visits.find((visit) => visit.id === id);
      if (!current) return null;
      const memoryIds = memoryId
        ? [...new Set([...(current.memoryIds ?? []), memoryId])]
        : current.memoryIds ?? [];
      const updated: Visit = {
        ...current,
        memoryIds,
        memoryProcessingStatus: status,
        memoryProcessingUpdatedAt: timestamp,
        memoryProcessingError: errorCode,
        mockPhotos: status === 'failed' ? current.mockPhotos : undefined,
      };
      await writePersistedVisits(visits.map((visit) => visit.id === id ? updated : visit));
      return updated;
    });
  }

  async getVisitCountForPlace(placeId: string): Promise<number> {
    return (await this.getVisitsByPlaceId(placeId)).length;
  }

  async clear(): Promise<void> {
    await enqueueMutation(() => writePersistedVisits([]));
  }
}

export const visitRepository = new LocalVisitRepository();
