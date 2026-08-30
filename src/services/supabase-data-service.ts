import { supabase } from '@/lib/supabase';
import type { Memory, Photo, Place, Visit } from '@/types/trace';

export type CloudTraceData = { places: Place[]; visits: Visit[]; memories: Memory[] };

function coordinates(row: Record<string, unknown>) { return { latitude: Number(row.latitude ?? 0), longitude: Number(row.longitude ?? 0) }; }

function mapPlace(row: Record<string, unknown>): Place {
  return { id: String(row.id), userId: row.user_id ? String(row.user_id) : undefined, name: String(row.name ?? '알 수 없는 장소'), category: String(row.category ?? 'PLACE').toUpperCase() as Place['category'], resolvedCategory: row.resolved_category as Place['resolvedCategory'], location: coordinates(row), address: row.address ? String(row.address) : undefined, externalPlaceId: row.external_place_id ? String(row.external_place_id) : undefined, visitCount: Number(row.visit_count ?? 0), photoCount: Number(row.photo_count ?? 0), firstVisitedAt: row.first_visited_at ? String(row.first_visited_at) : undefined, lastVisitedAt: row.last_visited_at ? String(row.last_visited_at) : undefined, createdAt: row.created_at ? String(row.created_at) : undefined };
}

function mapVisit(row: Record<string, unknown>): Visit {
  const startedAt = String(row.started_at);
  return { id: String(row.id), userId: row.user_id ? String(row.user_id) : undefined, placeId: String(row.place_id), startedAt, endedAt: row.ended_at ? String(row.ended_at) : undefined, durationMinutes: row.duration_minutes !== undefined ? Number(row.duration_minutes) : row.duration_seconds !== undefined ? Math.round(Number(row.duration_seconds) / 60) : undefined, visitNumber: Number(row.visit_number ?? 1), location: coordinates(row), source: (row.source === 'mock' || row.source === 'demo' ? row.source : 'gps') as Visit['source'], confidence: row.confidence === undefined ? undefined : Number(row.confidence), createdAt: String(row.created_at ?? startedAt), memoryIds: Array.isArray(row.memory_ids) ? row.memory_ids.map(String) : [] };
}

function mapPhoto(row: Record<string, unknown>): Photo {
  return { id: String(row.id), assetId: row.asset_id ? String(row.asset_id) : undefined, userId: row.user_id ? String(row.user_id) : undefined, uri: String(row.uri ?? row.storage_url ?? ''), takenAt: String(row.captured_at ?? row.taken_at ?? row.created_at), location: row.latitude !== undefined && row.longitude !== undefined ? coordinates(row) : undefined, width: row.width ? Number(row.width) : undefined, height: row.height ? Number(row.height) : undefined, filename: row.filename ? String(row.filename) : undefined, source: 'media-library', isLocallyAvailable: false };
}

export async function loadCloudTraceData(userId: string): Promise<CloudTraceData | null> {
  if (!supabase) return null;
  const [placesResponse, visitsResponse, memoriesResponse, photosResponse] = await Promise.all([
    supabase.from('places').select('*').eq('user_id', userId).is('deleted_at', null),
    supabase.from('visits').select('*').eq('user_id', userId).is('deleted_at', null),
    supabase.from('memories').select('*').eq('user_id', userId).is('deleted_at', null),
    supabase.from('photos').select('*').eq('user_id', userId).is('deleted_at', null),
  ]);
  const error = placesResponse.error ?? visitsResponse.error ?? memoriesResponse.error ?? photosResponse.error;
  if (error) throw new Error(`Cloud trace data could not be loaded: ${error.message}`);
  const photosByMemory = new Map<string, Photo[]>();
  (photosResponse.data ?? []).forEach((row) => { const memoryId = row.memory_id ? String(row.memory_id) : ''; if (!memoryId) return; const list = photosByMemory.get(memoryId) ?? []; list.push(mapPhoto(row)); photosByMemory.set(memoryId, list); });
  const memories = (memoriesResponse.data ?? []).map((row) => ({ id: String(row.id), userId: userId, placeId: String(row.place_id), visitId: String(row.visit_id), title: String(row.title ?? 'Trace Memory'), visitNumber: Number(row.visit_number ?? 1), startedAt: String(row.started_at ?? row.created_at), endedAt: String(row.ended_at ?? row.started_at ?? row.created_at), photos: photosByMemory.get(String(row.id)) ?? [], coverPhotoId: row.cover_photo_id ? String(row.cover_photo_id) : undefined, location: coordinates(row), summary: row.summary ? String(row.summary) : undefined, createdAt: String(row.created_at ?? new Date().toISOString()) })) as Memory[];
  return { places: (placesResponse.data ?? []).map(mapPlace), visits: (visitsResponse.data ?? []).map(mapVisit), memories };
}
