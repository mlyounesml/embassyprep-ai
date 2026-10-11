// OpenAI Whisper speech-to-text via REST. No SDK, no hardcoded key.
export async function transcribeAudio(audioBlob, apiKey) {
  if (!apiKey) throw new Error('Missing OpenAI API key.');
  if (!audioBlob || audioBlob.size === 0) throw new Error('Empty recording.');

  const form = new FormData();
  form.append('file', new File([audioBlob], 'answer.webm', { type: audioBlob.type || 'audio/webm' }));
  form.append('model', 'whisper-1');
  form.append('language', 'en');
  form.append('response_format', 'json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) throw new Error('OpenAI key rejected (401). Check the key in Settings.');
    if (res.status === 429) throw new Error('OpenAI rate limit / no credit (429).');
    throw new Error(`Whisper failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const transcript = (data.text || '').trim();
  if (!transcript) throw new Error('Whisper returned empty text. Re-record closer to the mic.');
  return transcript;
}
