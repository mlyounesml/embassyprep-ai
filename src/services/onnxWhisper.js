// On-device Whisper fallback (for Brave / Safari / Firefox / offline Google service).
// Runs Xenova/whisper-tiny.en fully in the browser via transformers.js.
// No keys, no accounts. First use downloads ~40MB once, then cached.
// Single-threaded (numThreads=1) so GitHub Pages needs no special headers.

let pipePromise = null;

async function getPipe(onProgress) {
  if (!pipePromise) {
    pipePromise = (async () => {
      const { pipeline, env } = await import('@xenova/transformers');
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;
      return pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
        quantized: true,
        progress_callback: (p) => {
          if (p?.status === 'downloading' && p?.progress != null) onProgress?.(p.progress / 100);
          else if (p?.status === 'progress' && p?.progress != null) onProgress?.(p.progress / 100);
        },
      });
    })().catch((e) => {
      pipePromise = null;
      throw e;
    });
  }
  return pipePromise;
}

async function blobToMono16k(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    const buf = await blob.arrayBuffer();
    const audio = await ctx.decodeAudioData(buf);
    const targetRate = 16000;
    const duration = audio.duration;
    const offline = new OfflineAudioContext(1, Math.ceil(duration * targetRate), targetRate);
    const src = offline.createBufferSource();
    src.buffer = audio;
    src.connect(offline.destination);
    src.start(0);
    const rendered = await offline.startRendering();
    return rendered.getChannelData(0);
  } finally {
    ctx.close().catch(() => {});
  }
}

export async function transcribeOnDevice(blob, onProgress) {
  if (!blob || blob.size === 0) throw new Error('Empty recording.');
  const transcriber = await getPipe(onProgress);
  const audio = await blobToMono16k(blob);
  const out = await transcriber(audio, {
    chunk_length_s: 30,
    stride_length_s: 5,
    language: 'en',
    task: 'transcribe',
  });
  const text = (out?.text || '').trim();
  if (!text) throw new Error('On-device transcription heard nothing. Speak closer/louder, or type the answer.');
  return text;
}
