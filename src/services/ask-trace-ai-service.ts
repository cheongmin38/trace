import type { AskTraceSearchResult } from '@/types/ask-trace-search';
import { renderAskTraceAnswer, type AskTraceAnswer } from '@/services/ask-trace-answer-service';

type CompactResult = Pick<AskTraceSearchResult, 'answerType' | 'totalResults'> & {
  results: Record<string, unknown>[];
};

const compact = (result: AskTraceSearchResult): CompactResult => ({
  answerType: result.answerType,
  totalResults: result.totalResults,
  results: result.results.slice(0, 5).map((item) => ({
    id: item.id,
    place: item.place ? { id: item.place.id, name: item.place.name, address: item.place.address, category: item.place.category } : undefined,
    visit: item.visit ? { id: item.visit.id, placeId: item.visit.placeId, startedAt: item.visit.startedAt, endedAt: item.visit.endedAt } : undefined,
    memory: item.memory ? { id: item.memory.id, placeId: item.memory.placeId, startedAt: item.memory.startedAt, photoIds: item.memory.photos.slice(0, 8).map((photo) => photo.id) } : undefined,
    count: item.count,
    photoCount: item.photoCount,
    startDate: item.startDate,
    endDate: item.endDate,
    placeCount: item.placeCount,
  })),
});

export async function generateRemoteAskTraceAnswer(question: string, result: AskTraceSearchResult): Promise<AskTraceAnswer> {
  if (!result.totalResults) return renderAskTraceAnswer(question, result);
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  const url = baseUrl ? `${baseUrl}/api/ask` : '/api/ask';
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, result: compact(result) }) });
    if (!response.ok) throw new Error(`Ask API ${response.status}`);
    const payload = await response.json() as { text?: string; model?: string };
    if (!payload.text?.trim()) throw new Error('Ask API returned an empty answer');
    return { text: payload.text.trim(), generatedBy: 'ai', model: payload.model };
  } catch (error) {
    console.error('Remote Ask Trace unavailable; using verified template', error);
    return renderAskTraceAnswer(question, result);
  }
}
