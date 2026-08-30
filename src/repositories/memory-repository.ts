import { readPersistedMemories, writePersistedMemories } from '@/repositories/local-storage';
import type { Memory, Photo } from '@/types/trace';

export interface MemoryRepository {
  getMemories(): Promise<Memory[]>;
  getMemoryById(id: string): Promise<Memory | null>;
  getMemoryByVisitId(visitId: string): Promise<Memory | null>;
  getAssignedPhotoIds(excludeVisitId?: string): Promise<Set<string>>;
  createMemory(memory: Memory): Promise<Memory | null>;
  addPhotos(memoryId: string, photos: Photo[]): Promise<Memory | null>;
  removePhoto(memoryId: string, photoId: string): Promise<Memory | null>;
  setCoverPhoto(memoryId: string, photoId: string): Promise<Memory | null>;
  updateMemory(memoryId: string, values: Partial<Omit<Memory, 'id'>>): Promise<Memory | null>;
  deleteMemory(memoryId: string): Promise<Memory | null>;
}

let mutationQueue: Promise<void> = Promise.resolve();

async function enqueueMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(operation, operation);
  mutationQueue = result.then(() => undefined, () => undefined);
  return result;
}

const photoKey = (photo: Photo) => photo.assetId ?? photo.id;

function deduplicatePhotos(photos: Photo[]): Photo[] {
  const unique = new Map<string, Photo>();
  photos.forEach((photo) => {
    const key = photoKey(photo);
    if (!unique.has(key)) unique.set(key, photo);
  });
  return [...unique.values()];
}

function assignedPhotoIds(memories: Memory[], excludeVisitId?: string): Set<string> {
  return new Set(
    memories
      .filter((memory) => memory.visitId !== excludeVisitId)
      .flatMap((memory) => memory.photos.map(photoKey)),
  );
}

class LocalMemoryRepository implements MemoryRepository {
  async getMemories(): Promise<Memory[]> {
    return (await readPersistedMemories()).sort(
      (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    );
  }

  async getMemoryById(id: string): Promise<Memory | null> {
    return (await this.getMemories()).find((memory) => memory.id === id) ?? null;
  }

  async getMemoryByVisitId(visitId: string): Promise<Memory | null> {
    return (await this.getMemories()).find((memory) => memory.visitId === visitId) ?? null;
  }

  async getAssignedPhotoIds(excludeVisitId?: string): Promise<Set<string>> {
    return assignedPhotoIds(await readPersistedMemories(), excludeVisitId);
  }

  async createMemory(memory: Memory): Promise<Memory | null> {
    return enqueueMutation(async () => {
      const memories = await readPersistedMemories();
      const existing = memories.find((item) => item.id === memory.id || item.visitId === memory.visitId);
      if (existing) return existing;

      const reserved = assignedPhotoIds(memories, memory.visitId);
      const photos = deduplicatePhotos(memory.photos).filter((photo) => !reserved.has(photoKey(photo)));
      if (!photos.length) return null;
      const coverPhotoId = photos.some((photo) => photo.id === memory.coverPhotoId)
        ? memory.coverPhotoId
        : photos[0].id;
      const persisted = { ...memory, photos, coverPhotoId };
      await writePersistedMemories([...memories, persisted]);
      return persisted;
    });
  }

  async addPhotos(memoryId: string, additions: Photo[]): Promise<Memory | null> {
    return enqueueMutation(async () => {
      const memories = await readPersistedMemories();
      const index = memories.findIndex((memory) => memory.id === memoryId);
      if (index < 0) return null;
      const current = memories[index];
      const reserved = assignedPhotoIds(memories, current.visitId);
      const available = additions
        .map((photo) => ({ ...photo, source: 'manual' as const, match: undefined }))
        .filter((photo) => !reserved.has(photoKey(photo)));
      const photos = deduplicatePhotos([...current.photos, ...available]);
      const addedIds = new Set(available.flatMap((photo) => [photo.id, photoKey(photo)]));
      const updated: Memory = {
        ...current,
        photos,
        coverPhotoId: current.coverPhotoId ?? photos[0]?.id,
        excludedPhotoIds: (current.excludedPhotoIds ?? []).filter((id) => !addedIds.has(id)),
      };
      memories[index] = updated;
      await writePersistedMemories(memories);
      return updated;
    });
  }

  async removePhoto(memoryId: string, photoId: string): Promise<Memory | null> {
    return enqueueMutation(async () => {
      const memories = await readPersistedMemories();
      const index = memories.findIndex((memory) => memory.id === memoryId);
      if (index < 0) return null;
      const current = memories[index];
      const removed = current.photos.find((photo) => photo.id === photoId || photoKey(photo) === photoId);
      if (!removed) return current;
      const photos = current.photos.filter((photo) => photo !== removed);
      const excludedPhotoIds = [...new Set([...(current.excludedPhotoIds ?? []), removed.id, photoKey(removed)])];
      const updated: Memory = {
        ...current,
        photos,
        coverPhotoId: current.coverPhotoId === removed.id ? photos[0]?.id : current.coverPhotoId,
        excludedPhotoIds,
      };
      memories[index] = updated;
      await writePersistedMemories(memories);
      return updated;
    });
  }

  async setCoverPhoto(memoryId: string, photoId: string): Promise<Memory | null> {
    return enqueueMutation(async () => {
      const memories = await readPersistedMemories();
      const index = memories.findIndex((memory) => memory.id === memoryId);
      if (index < 0) return null;
      const current = memories[index];
      const cover = current.photos.find((photo) => photo.id === photoId || photoKey(photo) === photoId);
      if (!cover) return current;
      const updated = {
        ...current,
        coverPhotoId: cover.id,
        photos: [cover, ...current.photos.filter((photo) => photo !== cover)],
      };
      memories[index] = updated;
      await writePersistedMemories(memories);
      return updated;
    });
  }

  async updateMemory(memoryId: string, values: Partial<Omit<Memory, 'id'>>): Promise<Memory | null> {
    return enqueueMutation(async () => { const all=await readPersistedMemories(); const i=all.findIndex(m=>m.id===memoryId); if(i<0)return null; const updated={...all[i],...values,id:memoryId}; all[i]=updated; await writePersistedMemories(all); return updated; });
  }
  async deleteMemory(memoryId: string): Promise<Memory | null> {
    return enqueueMutation(async () => { const all=await readPersistedMemories(); const removed=all.find(m=>m.id===memoryId)??null; if(removed) await writePersistedMemories(all.filter(m=>m.id!==memoryId)); return removed; });
  }
}

export const memoryRepository = new LocalMemoryRepository();
