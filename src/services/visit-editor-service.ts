import { visitRepository } from '@/repositories/visit-repository';
import { memoryRepository } from '@/repositories/memory-repository';
import { placeRepository } from '@/repositories/place-repository';
import { useAppStore } from '@/store/app-store';
import { minutesBetween } from '@/utils/time';
import { enqueueSyncRecord } from '@/services/sync-service';

export async function updateVisitDetails(id:string, input:{placeId:string; startedAt:string; endedAt:string}) {
  const current=await visitRepository.getVisitById(id); if(!current) throw new Error('방문 기록을 찾을 수 없어요');
  const place=await placeRepository.getPlaceById(input.placeId); if(!place) throw new Error('장소를 찾을 수 없어요');
  if(!Number.isFinite(new Date(input.startedAt).getTime())||!Number.isFinite(new Date(input.endedAt).getTime())||new Date(input.endedAt)<=new Date(input.startedAt)) throw new Error('시간을 확인해 주세요');
  const visit=await visitRepository.updateVisit(id,{...input,location:place.location,durationMinutes:minutesBetween(input.startedAt,input.endedAt)}); if(!visit) throw new Error('저장에 실패했어요');
  useAppStore.getState().updateVisit(visit);
  await enqueueSyncRecord({ id: visit.id, entity: 'visit', userId: visit.userId ?? 'local-user', payload: visit });
  for(const memoryId of current.memoryIds??[]){ const m=await memoryRepository.updateMemory(memoryId,{placeId:place.id,title:place.name,startedAt:visit.startedAt,endedAt:visit.endedAt,location:visit.location,visitNumber:visit.visitNumber}); if(m) { useAppStore.getState().addMemory(m); await enqueueSyncRecord({id:m.id,entity:'memory',userId:m.userId??'local-user',payload:m}); } }
  return visit;
}

export async function deleteVisitWithRelations(id:string){ const visit=await visitRepository.getVisitById(id); if(!visit)return false; const linked=await memoryRepository.getMemories(); for(const m of linked.filter(x=>x.visitId===id)){ await memoryRepository.deleteMemory(m.id); await enqueueSyncRecord({id:m.id,entity:'memory',userId:m.userId??'local-user',payload:m,deletedAt:new Date().toISOString()}); } await visitRepository.deleteVisit(id); await enqueueSyncRecord({id,entity:'visit',userId:visit.userId??'local-user',payload:visit,deletedAt:new Date().toISOString()}); useAppStore.getState().removeVisit(id); return true; }
