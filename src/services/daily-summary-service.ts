import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Place, Visit } from '@/types/trace';
import { recordAiUsage } from '@/services/ai-usage-service';

export type DailySummaryInput = { sourceDate:string; visits:Visit[]; places:Place[]; photoCount?:number; trip?:boolean };
export type DailySummary = { summary:string; generatedAt:string; generatorVersion:string; sourceDate:string };
export interface DailySummaryProvider { generate(input:DailySummaryInput):Promise<string>; }
const key=(date:string)=>`trace:daily-summary:${date}`;
const formatDuration=(minutes:number)=>minutes>=60?`${Math.floor(minutes/60)}시간 ${minutes%60?`${minutes%60}분`:''}`:`${minutes}분`;
export function createTemplateSummary(input:DailySummaryInput){
 const ordered=[...input.visits].sort((a,b)=>new Date(a.startedAt).getTime()-new Date(b.startedAt).getTime());
 if(!ordered.length)return '오늘은 아직 기록된 방문이 없어요.';
 const names=ordered.map(v=>input.places.find(p=>p.id===v.placeId)?.name).filter(Boolean) as string[];
 const totalPhotos=input.photoCount??0;
 const parts=names.length===1?`${names[0]}에서 시간을 보냈어요.`:`${names.slice(0,-1).join(', ')}에서 시간을 보내고 마지막에는 ${names.at(-1)}에 들렀어요.`;
 const duration=ordered.reduce((s,v)=>s+(v.durationMinutes??0),0);
 return `오늘은 ${parts}${duration?` 총 ${formatDuration(duration)} 머물렀어요.`:''}${totalPhotos?` 오늘 ${totalPhotos}장의 사진이 새로운 추억으로 남았습니다.`:''}`;
}
export async function generateDailySummary(input:DailySummaryInput, provider?:DailySummaryProvider):Promise<DailySummary>{
 const cached=await AsyncStorage.getItem(key(input.sourceDate)); if(cached) return JSON.parse(cached) as DailySummary;
 let summary:string; const started=Date.now(); try{summary=provider?await provider.generate(input):createTemplateSummary(input); if(provider) await recordAiUsage({feature:'daily-summary',model:'LUNA',inputTokens:Math.ceil(JSON.stringify({sourceDate:input.sourceDate,visits:input.visits.length}).length/4),outputTokens:Math.ceil(summary.length/4),cachedTokens:0,latency:Date.now()-started,success:true,createdAt:new Date().toISOString()});}catch(error){console.error('Trace daily summary generation failed',error);summary=createTemplateSummary(input); if(provider) await recordAiUsage({feature:'daily-summary',model:'LUNA',inputTokens:0,outputTokens:0,cachedTokens:0,latency:Date.now()-started,success:false,createdAt:new Date().toISOString()});}
 const result={summary,generatedAt:new Date().toISOString(),generatorVersion:provider?'ai-v1':'template-v1',sourceDate:input.sourceDate}; await AsyncStorage.setItem(key(input.sourceDate),JSON.stringify(result)); return result;
}
