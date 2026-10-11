// OpenAI Whisper speech-to-text.
// If VITE_PROXY_URL is set, audio goes to your own proxy (keys stay server-side).
// Otherwise the family key from memory/localStorage is used directly.

const PROXY = import.meta.env.VITE_PROXY_URL || '';
const TIMEOUT_MS = 90000;
const MAX_BYTES = 24 * 1024 * 1024; // Whisper hard limit is 25MB

export function extensionFor(mimeType) {
  if ((mimeType || '').includes('mp4')) return 'mp4';
  if ((mimeType || '').includes('wav')) return 'wav';
  return 'webm';
}

export async function transcribeAudio(audioBlob, apiKey, externalSignal) {
  if (!audioBlob || audioBlob.size === 0) throw new Error('Empty recording.');
  if (audioBlob.size > MAX_BYTES) {
    throw new Error(
      `Recording is ${(audioBlob.size / 1048576).toFixed(1)}MB — over the 25MB Whisper limit. Record under 2 minutes.`,
    );
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error('Whisper timed out (90s). Check connection and retry.')), TIMEOUT_MS);
  const onAbort = () => ctrl.abort(externalSignal?.reason);
  externalSignal?.addEventListener('abort', onAbort, { once: true });

  try {
    if (PROXY) {
      const form = new FormData();
      form.append('file', audioBlob, `answer.${extensionFor(audioBlob.type)}`);
      const res = await fetch(`${PROXY}/whisper`, { method: 'POST', body: form, signal: ctrl.signal });
      if (!res.ok) throw new Error(`Transcription proxy failed (${res.status}).`);
      const data = await res.json();
      const transcript = (data.text || '').trim();
      if (!transcript) throw new Error('Transcription came back empty. Re-record closer to the mic.');
      return transcript;
    }

    if (!apiKey) throw new Error('Missing OpenAI API key.');
    const form = new FormData();
    form.append(
      'file',
      new File([audioBlob], `answer.${extensionFor(audioBlob.type)}`, {
        type: audioBlob.type || 'audio/webm',
      }),
    );
    form.append('model', 'whisper-1');
    form.append('language', 'en');
    form.append('response_format', 'json');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: ctrl.signal,
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
  } catch (e) {
    if (e?.name === 'AbortError' || /abort/i.test(e?.message || '')) {
      throw new Error('Whisper timed out (90s). Your recording is kept — press "Evaluate again".');
    }
    throw e;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onAbort);
  }
}
