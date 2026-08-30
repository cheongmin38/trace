import { useAppStore } from '@/store/app-store';
import type { Memory } from '@/types/trace';

export async function getMemories() { return useAppStore.getState().memories; }
export async function getMemoryById(id: string) { return useAppStore.getState().memories.find((memory) => memory.id === id) ?? null; }
export async function getMemoriesByPlace(placeId: string) { return useAppStore.getState().memories.filter((memory) => memory.placeId === placeId); }
export async function createMemory(memory: Memory) { useAppStore.getState().addMemory(memory); return memory; }
export async function deleteMemory(id: string) { return useAppStore.getState().removeMemory(id); }
