import { create } from 'zustand';
import { memories as mockMemories, photos as mockPhotos, places as mockPlaces, visits as mockVisits } from '@/services/mock-archive';
import type { AppSettings, Coordinates, Memory, Photo, Place, ThemePreference, TimelineFilter, UserStats, Visit } from '@/types/trace';
import { deriveUserStats } from '@/utils/trace-selectors';
import { demoDataEnabled } from '@/config/runtime';

const defaultSettings: AppSettings = {
  locationTrackingEnabled: true,
  photoMatchingEnabled: true,
  includeScreenshotsInMemories: false,
  automaticMemoryEnabled: true,
  notificationsEnabled: true,
  showHomeMemories: false,
  showWorkMemories: false,
};

const initialPlaces = demoDataEnabled ? mockPlaces : [];
const initialVisits = demoDataEnabled ? mockVisits : [];
const initialMemories = demoDataEnabled ? mockMemories : [];
const initialPhotos = demoDataEnabled ? mockPhotos : [];

type VisitInput = Omit<Visit, 'visitNumber'> & { visitNumber?: number };

type AppState = {
  places: Place[];
  visits: Visit[];
  memories: Memory[];
  deletedMemories: Array<Memory & { deletedAt: string }>;
  deletedVisits: Array<Visit & { deletedAt: string }>;
  photos: Photo[];
  selectedPlaceId: string | null;
  selectedMemoryId: string | null;
  currentLocation: Coordinates | null;
  isPremium: boolean;
  theme: ThemePreference;
  timelineFilter: TimelineFilter;
  searchQuery: string;
  settings: AppSettings;
  userStats: UserStats;
  selectPlace: (placeId: string | null) => void;
  selectMemory: (memoryId: string | null) => void;
  addPlace: (place: Place) => void;
  addVisit: (visit: VisitInput) => Visit;
  updateVisit: (visit: Visit) => Visit;
  removeVisit: (visitId: string) => boolean;
  hydrateTrackedData: (places: Place[], visits: Visit[], memories?: Memory[]) => void;
  resetTrackedData: () => void;
  addMemory: (memory: Memory) => void;
  removeMemory: (memoryId: string) => boolean;
  restoreMemory: (memoryId: string) => boolean;
  restoreVisit: (visitId: string) => boolean;
  permanentlyDeleteMemory: (memoryId: string) => boolean;
  permanentlyDeleteVisit: (visitId: string) => boolean;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setCurrentLocation: (location: Coordinates | null) => void;
  setTimelineFilter: (filter: TimelineFilter) => void;
  setSearchQuery: (query: string) => void;
  setTheme: (theme: ThemePreference) => void;
  setPremium: (isPremium: boolean) => void;
  togglePremium: () => void;
  toggleFavorite: (memoryId: string) => void;
  clearSelection: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  places: initialPlaces,
  visits: initialVisits,
  memories: initialMemories,
  deletedMemories: [],
  deletedVisits: [],
  photos: initialPhotos,
  selectedPlaceId: null,
  selectedMemoryId: null,
  currentLocation: null,
  isPremium: false,
  theme: 'system',
  timelineFilter: 'ALL',
  searchQuery: '',
  settings: defaultSettings,
  userStats: deriveUserStats(initialPlaces, initialMemories, initialVisits),

  selectPlace: (selectedPlaceId) => set({ selectedPlaceId }),
  selectMemory: (selectedMemoryId) => {
    const memory = selectedMemoryId ? get().memories.find((item) => item.id === selectedMemoryId) : null;
    set({ selectedMemoryId, selectedPlaceId: memory?.placeId ?? (selectedMemoryId ? get().selectedPlaceId : null) });
  },
  addPlace: (place) => set((state) => {
    const places = state.places.some((item) => item.id === place.id) ? state.places.map((item) => item.id === place.id ? place : item) : [...state.places, place];
    return { places, userStats: deriveUserStats(places, state.memories, state.visits) };
  }),
  addVisit: (input) => {
    const state = get();
    const provisional: Visit = { ...input, visitNumber: input.visitNumber ?? 0 };
    const combined = [...state.visits.filter((item) => item.id !== provisional.id), provisional];
    const chronological = combined.filter((item) => item.placeId === provisional.placeId).sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime());
    const numberById = new Map(chronological.map((item, index) => [item.id, index + 1]));
    const visits = combined.map((item) => item.placeId === provisional.placeId ? { ...item, visitNumber: numberById.get(item.id) ?? item.visitNumber } : item);
    const visit = visits.find((item) => item.id === provisional.id)!;
    const memories = state.memories.map((memory) => numberById.has(memory.visitId) ? { ...memory, visitNumber: numberById.get(memory.visitId)! } : memory);
    const places = state.places.map((place) => place.id === visit.placeId ? { ...place, visitCount: chronological.length, firstVisitedAt: chronological[0]?.startedAt, lastVisitedAt: chronological.at(-1)?.startedAt } : place);
    set({ visits, memories, places, userStats: deriveUserStats(places, memories, visits) });
    return visit;
  },
  updateVisit: (visit) => {
    const state = get();
    const exists = state.visits.some((item) => item.id === visit.id);
    if (!exists) return get().addVisit(visit);
    const visits = state.visits.map((item) => item.id === visit.id ? visit : item);
    const chronological = visits.filter((item) => item.placeId === visit.placeId).sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime());
    const places = state.places.map((place) => { const rows=visits.filter(v=>v.placeId===place.id).sort((a,b)=>new Date(a.startedAt).getTime()-new Date(b.startedAt).getTime()); return rows.length ? {...place,visitCount:rows.length,firstVisitedAt:rows[0].startedAt,lastVisitedAt:rows.at(-1)?.startedAt}:place; });
    set({ visits, places, userStats: deriveUserStats(places, state.memories, visits) });
    return visit;
  },
  removeVisit: (visitId) => { const state=get(); const removedVisit=state.visits.find(v=>v.id===visitId); if(!removedVisit) return false; const removedMemories=state.memories.filter(m=>m.visitId===visitId); const visits=state.visits.filter(v=>v.id!==visitId); const memories=state.memories.filter(m=>m.visitId!==visitId); const places=state.places.map(p=>{const rows=visits.filter(v=>v.placeId===p.id).sort((a,b)=>new Date(a.startedAt).getTime()-new Date(b.startedAt).getTime()); return {...p,visitCount:rows.length,firstVisitedAt:rows[0]?.startedAt,lastVisitedAt:rows.at(-1)?.startedAt};}); const deletedAt=new Date().toISOString(); set({visits,memories,deletedVisits:[{...removedVisit,deletedAt},...state.deletedVisits.filter(v=>v.id!==visitId)],deletedMemories:[...removedMemories.map(m=>({...m,deletedAt})),...state.deletedMemories.filter(m=>!removedMemories.some(x=>x.id===m.id))],places,userStats:deriveUserStats(places,memories,visits)}); return true; },
  hydrateTrackedData: (trackedPlaces, trackedVisits, trackedMemories = []) => set((state) => {
    const placesById = new Map(state.places.map((place) => [place.id, place]));
    trackedPlaces.forEach((place) => placesById.set(place.id, { ...placesById.get(place.id), ...place }));
    const visitsById = new Map(state.visits.map((visit) => [visit.id, visit]));
    trackedVisits.forEach((visit) => visitsById.set(visit.id, visit));
    const visits = [...visitsById.values()];
    const memoriesById = new Map(state.memories.map((memory) => [memory.id, memory]));
    trackedMemories.forEach((memory) => memoriesById.set(memory.id, memory));
    const memories = [...memoriesById.values()].sort(
      (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    );
    const places = [...placesById.values()].map((place) => {
      const chronological = visits.filter((visit) => visit.placeId === place.id).sort((left, right) => new Date(left.startedAt).getTime() - new Date(right.startedAt).getTime());
      const placePhotos = memories.filter((memory) => memory.placeId === place.id).flatMap((memory) => memory.photos);
      if (!chronological.length) return {
        ...place,
        photoCount: placePhotos.length || place.photoCount,
        coverPhoto: place.coverPhoto ?? placePhotos[0]?.uri,
      };
      return {
        ...place,
        visitCount: chronological.length,
        firstVisitedAt: chronological[0].startedAt,
        lastVisitedAt: chronological.at(-1)?.startedAt,
        photoCount: placePhotos.length,
        coverPhoto: place.coverPhoto ?? placePhotos[0]?.uri,
      };
    });
    const photosById = new Map(memories.flatMap((memory) => memory.photos).map((photo) => [photo.id, photo]));
    return { places, visits, memories, photos: [...photosById.values()], userStats: deriveUserStats(places, memories, visits) };
  }),
  resetTrackedData: () => set(() => ({
    places: initialPlaces,
    visits: initialVisits,
    memories: initialMemories,
    photos: initialPhotos,
    currentLocation: null,
    userStats: deriveUserStats(initialPlaces, initialMemories, initialVisits),
  })),
  addMemory: (memory) => set((state) => {
    const memories = [memory, ...state.memories.filter((item) => item.id !== memory.id)].sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime());
    const photosById = new Map(state.photos.map((photo) => [photo.id, photo]));
    memory.photos.forEach((photo) => photosById.set(photo.id, photo));
    const photos = [...photosById.values()];
    const placePhotos = memories.filter((item) => item.placeId === memory.placeId).flatMap((item) => item.photos);
    const places = state.places.map((place) => place.id === memory.placeId ? { ...place, photoCount: placePhotos.length, coverPhoto: place.coverPhoto ?? memory.photos[0]?.uri } : place);
    return { memories, photos, places, userStats: deriveUserStats(places, memories, state.visits) };
  }),
  removeMemory: (memoryId) => {
    const state = get();
    const removed = state.memories.find((memory) => memory.id === memoryId);
    if (!removed) return false;
    const memories = state.memories.filter((memory) => memory.id !== memoryId);
    const photos = memories.flatMap((memory) => memory.photos).filter((photo, index, all) => all.findIndex((item) => item.id === photo.id) === index);
    const places = state.places.map((place) => place.id === removed.placeId
      ? { ...place, photoCount: memories.filter((memory) => memory.placeId === place.id).reduce((total, memory) => total + memory.photos.length, 0) }
      : place);
    set({ memories, photos, places, deletedMemories: [{ ...removed, deletedAt: new Date().toISOString() }, ...state.deletedMemories.filter((item) => item.id !== memoryId)], selectedMemoryId: state.selectedMemoryId === memoryId ? null : state.selectedMemoryId, userStats: deriveUserStats(places, memories, state.visits) });
    return true;
  },
  restoreMemory: (memoryId) => { const state=get(); const item=state.deletedMemories.find(m=>m.id===memoryId); if(!item)return false; const {deletedAt: _deletedAt,...memory}=item; get().addMemory(memory); set({deletedMemories:state.deletedMemories.filter(m=>m.id!==memoryId)}); return true; },
  restoreVisit: (visitId) => { const state=get(); const item=state.deletedVisits.find(v=>v.id===visitId); if(!item)return false; const {deletedAt: _deletedAt,...visit}=item; get().addVisit(visit); set({deletedVisits:state.deletedVisits.filter(v=>v.id!==visitId)}); return true; },
  permanentlyDeleteMemory: (memoryId) => { const state=get(); if(!state.deletedMemories.some(m=>m.id===memoryId))return false; set({deletedMemories:state.deletedMemories.filter(m=>m.id!==memoryId)}); return true; },
  permanentlyDeleteVisit: (visitId) => { const state=get(); if(!state.deletedVisits.some(v=>v.id===visitId))return false; set({deletedVisits:state.deletedVisits.filter(v=>v.id!==visitId)}); return true; },
  updateSettings: (values) => set((state) => ({ settings: { ...state.settings, ...values } })),
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  setTimelineFilter: (timelineFilter) => set({ timelineFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTheme: (theme) => set({ theme }),
  setPremium: (isPremium) => set({ isPremium }),
  togglePremium: () => set((state) => ({ isPremium: !state.isPremium })),
  toggleFavorite: (memoryId) => set((state) => ({ memories: state.memories.map((memory) => memory.id === memoryId ? { ...memory, isFavorite: !memory.isFavorite } : memory) })),
  clearSelection: () => set({ selectedMemoryId: null, selectedPlaceId: null }),
}));

export type { AppState };
