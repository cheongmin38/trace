import { memories, places, visits } from '@/services/mock-archive';
import { parseAskQuery } from '@/services/ask-trace-query-parser';
import { searchAskTrace, type AskTraceSearchDependencies } from '@/services/ask-trace-search-service';
const deps: AskTraceSearchDependencies = { getPlaces: async()=>places, getVisits: async()=>visits, getMemories: async()=>memories };
const now=new Date('2026-08-29T12:00:00+09:00');
export const askTraceSearchCases=['서울숲 몇 번 갔어?','올해 가장 많이 간 장소는?','작년에 제주 갔어?','지난달에 갔던 카페','가장 오래 머문 곳','5월 부산 여행','올해 처음 가본 장소','이번 달 사진 몇 장이야?'];
export async function runAskTraceSearchCases(){return Promise.all(askTraceSearchCases.map(async question=>({question,result:await searchAskTrace(parseAskQuery(question,now),undefined,deps)})));}
