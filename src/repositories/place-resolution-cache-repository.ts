import {
  readPlaceResolutionCache,
  writePlaceResolutionCache,
} from '@/repositories/local-storage';
import type { PlaceResolutionCacheEntry } from '@/types/place-resolution';

const MAX_CACHE_ENTRIES = 500;
let mutationQueue: Promise<void> = Promise.resolve();

async function enqueueMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(operation, operation);
  mutationQueue = result.then(() => undefined, () => undefined);
  return result;
}

class LocalPlaceResolutionCacheRepository {
  async get(key: string, now = Date.now()): Promise<PlaceResolutionCacheEntry | null> {
    const entries = await readPlaceResolutionCache();
    return entries.find((entry) => entry.key === key && new Date(entry.expiresAt).getTime() > now) ?? null;
  }

  async set(entry: PlaceResolutionCacheEntry): Promise<void> {
    await enqueueMutation(async () => {
      const entries = await readPlaceResolutionCache();
      const next = [entry, ...entries.filter((item) => item.key !== entry.key)]
        .filter((item) => new Date(item.expiresAt).getTime() > Date.now())
        .slice(0, MAX_CACHE_ENTRIES);
      await writePlaceResolutionCache(next);
    });
  }
}

export const placeResolutionCacheRepository = new LocalPlaceResolutionCacheRepository();
