import type { Memory, Place, Visit } from '@/types/trace';

export type AskIntent = 'DATE_SEARCH' | 'PLACE_SEARCH' | 'TRIP_SEARCH' | 'STATISTICS' | 'MEMORY_SEARCH' | 'PHOTO_SEARCH';
export type AskTraceContext = { userId?: string; memories: Memory[]; visits: Visit[]; places: Place[] };
export type AskResult = { intent: AskIntent; answer: string; memories: Memory[]; visits: Visit[]; places: Place[] };

const empty = (intent: AskIntent): AskResult => ({ intent, answer: 'Trace 기록에서는 찾지 못했어요.', memories: [], visits: [], places: [] });
const dateLabel = (value: string) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
const inScope = <T extends { userId?: string }>(items: T[], userId?: string) => userId ? items.filter((item) => item.userId === userId) : items;

function detectIntent(query: string): AskIntent {
  if (/몇\s*번|가장\s*많이|처음\s*간/.test(query)) return 'STATISTICS';
  if (/여행|제주|부산|해외/.test(query)) return 'TRIP_SEARCH';
  if (/사진/.test(query)) return 'PHOTO_SEARCH';
  if (/작년|올해|지난|\d{1,2}월|\d{4}년/.test(query)) return 'DATE_SEARCH';
  return 'PLACE_SEARCH';
}

export function askTrace(query: string, context: AskTraceContext): AskResult {
  const normalized = query.trim().toLocaleLowerCase('ko-KR');
  const intent = detectIntent(normalized);
  if (!normalized) return empty(intent);
  const places = inScope(context.places, context.userId);
  const visits = inScope(context.visits, context.userId);
  const memories = inScope(context.memories, context.userId);
  const now = new Date();
  const namedPlace = places.find((place) => normalized.includes(place.name.toLocaleLowerCase('ko-KR')) || normalized.includes((place.address ?? '').toLocaleLowerCase('ko-KR')));
  const placeRows = namedPlace ? visits.filter((visit) => visit.placeId === namedPlace.id) : [];

  if (/올해\s*처음\s*간/.test(normalized)) {
    const year = now.getFullYear(); const first = [...visits].filter(v => new Date(v.startedAt).getFullYear() === year).sort((a,b) => +new Date(a.startedAt) - +new Date(b.startedAt))[0];
    if (!first) return empty('STATISTICS'); const place = places.find(p => p.id === first.placeId); if (!place) return empty('STATISTICS');
    return { intent: 'STATISTICS', answer: `올해 처음 기록된 장소는 ${place.name}이에요. ${dateLabel(first.startedAt)}에 방문했어요.`, memories: memories.filter(m => m.visitId === first.id), visits: [first], places: [place] };
  }
  if (/지난\s*6개월.*가장\s*많이.*카페/.test(normalized)) {
    const since = new Date(now); since.setMonth(since.getMonth() - 6); const cafes = places.filter(p => p.kind === 'CAFE' || /카페/.test(p.name));
    const ranked = cafes.map(p => ({ place:p, rows:visits.filter(v => v.placeId === p.id && +new Date(v.startedAt) >= +since) })).sort((a,b) => b.rows.length-a.rows.length)[0];
    if (!ranked?.rows.length) return empty('STATISTICS');
    return { intent:'STATISTICS', answer:`지난 6개월 동안 가장 많이 간 카페는 ${ranked.place.name}이에요. ${ranked.rows.length}번 방문했어요.`, memories:memories.filter(m=>m.placeId===ranked.place.id), visits:ranked.rows, places:[ranked.place] };
  }
  if (namedPlace && /몇\s*번|몇번/.test(normalized)) return { intent:'STATISTICS', answer:`Trace 기록에서 ${namedPlace.name}은(는) ${placeRows.length}번 방문했어요.`, memories:memories.filter(m=>m.placeId===namedPlace.id), visits:placeRows, places:[namedPlace] };
  if (namedPlace) { const related=memories.filter(m=>m.placeId===namedPlace.id); if (!placeRows.length && !related.length) return empty(intent); return { intent, answer:`${namedPlace.name}에 대한 방문 ${placeRows.length}건과 추억 ${related.length}개를 찾았어요.`, memories:related, visits:placeRows, places:[namedPlace] }; }
  const yearMatch=normalized.match(/(20\d{2})년|작년/); const monthMatch=normalized.match(/(\d{1,2})월/); const targetYear=yearMatch?.[1] ? Number(yearMatch[1]) : normalized.includes('작년') ? now.getFullYear()-1 : undefined;
  let matched=memories.filter(m => (!targetYear || new Date(m.startedAt).getFullYear()===targetYear) && (!monthMatch || new Date(m.startedAt).getMonth()+1===Number(monthMatch[1])));
  if (/여행|제주|부산/.test(normalized)) matched=matched.filter(m => { const p=places.find(x=>x.id===m.placeId); return Boolean(p && (p.category==='TRAVEL' || normalized.includes(p.name.toLocaleLowerCase('ko-KR')) || normalized.includes((p.address??'').toLocaleLowerCase('ko-KR')))); });
  if (!matched.length) return empty(intent);
  const matchedVisits=visits.filter(v=>matched.some(m=>m.visitId===v.id)); const matchedPlaces=places.filter(p=>matched.some(m=>m.placeId===p.id));
  const range=matched.sort((a,b)=>+new Date(a.startedAt)-+new Date(b.startedAt));
  return { intent, answer:`${dateLabel(range[0].startedAt)}부터 ${dateLabel(range.at(-1)!.startedAt)}까지 관련 추억 ${matched.length}개를 찾았어요.`, memories:matched, visits:matchedVisits, places:matchedPlaces };
}
