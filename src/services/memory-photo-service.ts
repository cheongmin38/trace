import { memoryRepository } from '@/repositories/memory-repository';
import { useAppStore } from '@/store/app-store';
import type { Memory, Photo } from '@/types/trace';

function syncMemory(memory: Memory | null): Memory | null {
  if (memory) useAppStore.getState().addMemory(memory);
  return memory;
}

export async function addPhotosToMemory(memoryId: string, photos: Photo[]): Promise<Memory | null> {
  return syncMemory(await memoryRepository.addPhotos(memoryId, photos));
}

export async function removePhotoFromMemory(memoryId: string, photoId: string): Promise<Memory | null> {
  return syncMemory(await memoryRepository.removePhoto(memoryId, photoId));
}

export async function setMemoryCoverPhoto(memoryId: string, photoId: string): Promise<Memory | null> {
  return syncMemory(await memoryRepository.setCoverPhoto(memoryId, photoId));
}
