const fail = (res, status, message) => res.status(status).json({ error: message });

async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fail(res, 503, 'AI service is not configured');
  const body = req.body;
  if (typeof body?.question !== 'string' || !body.result) return fail(res, 400, 'Invalid request');
  const model = process.env.ASK_TRACE_MODEL || 'gpt-5.4-mini';
  const prompt = `질문에 답하되 반드시 제공된 Trace 검색 결과에 있는 사실만 사용하세요. 결과에 없는 날짜, 장소, 감정, 관계를 만들지 마세요. 2~4문장 한국어로 간결하게 답하세요. 질문: ${body.question}\n검색 결과(JSON): ${JSON.stringify(body.result)}`;
  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, temperature: 0.2, max_tokens: 220, messages: [{ role: 'system', content: 'Trace의 검증된 검색 결과만 설명하는 도우미입니다.' }, { role: 'user', content: prompt }] }) });
    if (!upstream.ok) return fail(res, 502, 'AI provider request failed');
    const data = await upstream.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return fail(res, 502, 'AI provider returned no text');
    return res.status(200).json({ text, model });
  } catch (error) {
    console.error('Ask Trace provider error', error);
    return fail(res, 502, 'AI provider unavailable');
  }
}

module.exports = handler;
