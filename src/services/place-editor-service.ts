import { placeRepository } from '@/repositories/place-repository';
import { useAppStore } from '@/store/app-store';
import type { Place } from '@/types/trace';

export async function renamePlace(placeId: string, name: string): Promise<Place | null> {
  const updated = await placeRepository.renamePlace(placeId, name);
  if (updated) useAppStore.getState().addPlace(updated);
  return updated;
}
