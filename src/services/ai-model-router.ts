import type { AskQuery } from '@/types/ask-trace';
import type { AiFeature, AiModel } from '@/types/ai-usage';
export function routeAi(feature:AiFeature, input:string, options:{confidence?:number;complexity?:number}={}):AiModel { if(feature==='query-parser' && options.confidence!==undefined && options.confidence>=0.85)return 'NO_AI'; if(feature==='answer' && !input.trim())return 'NO_AI'; if((options.complexity??0)>0.8 || (options.confidence??1)<0.5)return 'TERRA'; return feature==='fuzzy-search'||feature==='photo-caption'||feature==='daily-summary'||feature==='answer'?'LUNA':'NO_AI'; }
export function shouldUseAiForQuery(query:AskQuery){return query.intent==='UNKNOWN';}
export const AI_LIMITS={maxOutputTokens:220,maxContextResults:5,maxPhotoResults:20,reasoning:'low' as const};
