// Google Gemini 1.5 Flash evaluation via REST. No hardcoded key.
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in Gemini reply.');
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function evaluateAnswer(question, transcript, apiKey) {
  if (!apiKey) throw new Error('Missing Gemini API key.');
  if (!transcript) throw new Error('Empty transcript.');

  const prompt = `You are a kind interview coach for Yahya, age 14, Egypt, practicing US Embassy youth/cultural exchange interview answers in English.
He understands English but hesitates, speaks slowly, pauses long, uses fillers (um, uh, like, you know).

Question: "${question}"
His answer transcript: "${transcript}"

Reply with ONLY a JSON object (no markdown fences preferred) with exactly these fields:
{
  "fluencyScore": number 0-100 (penalize hesitation, fillers, pauses, very short answers),
  "grammar": "1-2 sentence grammar check with a natural rephrasing",
  "relevance": "1-2 sentences: does the answer fit the question?",
  "feedback": "2-3 encouraging sentences for a 14-year-old, specific",
  "betterVersion": "A fluent 30-45 word model answer he can read aloud fast"
}
Score <80 means NOT mastered. Be strict but kind.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 400 && /key/i.test(text)) throw new Error('Gemini key invalid (400). Check the key in Settings.');
    if (res.status === 429) throw new Error('Gemini quota exceeded (429). Wait and retry.');
    throw new Error(`Gemini failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const reply =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!reply.trim()) throw new Error('Gemini returned empty reply.');

  const parsed = extractJson(reply);
  const fluencyScore = Math.max(0, Math.min(100, Number(parsed.fluencyScore) || 0));
  return {
    fluencyScore,
    grammar: String(parsed.grammar || '—'),
    relevance: String(parsed.relevance || '—'),
    feedback: String(parsed.feedback || '—'),
    betterVersion: String(parsed.betterVersion || '—'),
    mastered: fluencyScore >= 80,
    raw: reply.slice(0, 2000),
  };
}
