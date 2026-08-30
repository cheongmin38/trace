import type { AskQuery } from '@/types/ask-trace';
import { validateAskQuery } from '@/services/ask-trace-query-parser';

/** Optional LLM adapter. Implementations must use provider-native structured output, never JSON text parsing. */
export interface AskTraceStructuredProvider { parse(input:{question:string;today:string;timezone:string}):Promise<AskQuery>; }
export async function parseWithProvider(provider:AskTraceStructuredProvider, question:string, timezone:string, today=new Date()):Promise<AskQuery>{
  const result=await provider.parse({question,timezone,today:today.toISOString()});
  return validateAskQuery(result);
}
