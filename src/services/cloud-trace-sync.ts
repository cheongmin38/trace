import { memoryRepository } from '@/repositories/memory-repository';
import { placeRepository } from '@/repositories/place-repository';
import { visitRepository } from '@/repositories/visit-repository';
import { supabase } from '@/lib/supabase';

let scheduled = false;

/** Uploads metadata only. Photo binaries remain local until Storage upload is explicitly enabled. */
export async function syncLocalTraceData(userId: string): Promise<void> {
  if (!supabase || !userId || userId.startsWith('mock-') || scheduled) return;
  scheduled = true;
  try {
    const [places, visits, memories] = await Promise.all([placeRepository.getPlaces(), visitRepository.getVisits(), memoryRepository.getMemories()]);
    const placeRows = places.filter((place) => place.userId === userId).map((place) => ({ id: place.id, user_id: userId, name: place.name, address: place.address ?? null, latitude: place.location.latitude, longitude: place.location.longitude, category: place.category, resolved_category: place.resolvedCategory ?? null, external_place_id: place.externalPlaceId ?? null, visit_count: place.visitCount, photo_count: place.photoCount, first_visited_at: place.firstVisitedAt ?? null, last_visited_at: place.lastVisitedAt ?? null, updated_at: new Date().toISOString() }));
    const visitRows = visits.filter((visit) => visit.userId === userId).map((visit) => ({ id: visit.id, user_id: userId, place_id: visit.placeId, started_at: visit.startedAt, ended_at: visit.endedAt ?? null, duration_minutes: visit.durationMinutes ?? null, latitude: visit.location.latitude, longitude: visit.location.longitude, visit_number: visit.visitNumber, source: visit.source, confidence: visit.confidence ?? null, memory_ids: visit.memoryIds ?? [], updated_at: new Date().toISOString() }));
    const memoryRows = memories.filter((memory) => memory.userId === userId).map((memory) => ({ id: memory.id, user_id: userId, place_id: memory.placeId, visit_id: memory.visitId, title: memory.title, visit_number: memory.visitNumber, started_at: memory.startedAt, ended_at: memory.endedAt, latitude: memory.location.latitude, longitude: memory.location.longitude, summary: memory.summary ?? null, cover_photo_id: memory.coverPhotoId ?? null, updated_at: new Date().toISOString() }));
    if (placeRows.length) { const { error } = await supabase.from('places').upsert(placeRows); if (error) throw error; }
    if (visitRows.length) { const { error } = await supabase.from('visits').upsert(visitRows); if (error) throw error; }
    if (memoryRows.length) { const { error } = await supabase.from('memories').upsert(memoryRows); if (error) throw error; }
  } finally {
    scheduled = false;
  }
}
