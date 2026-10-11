// Keyless speech: built-in browser Web Speech API (no accounts, no billing).
// Chrome/Edge: live transcription on-device flow. Safari/Firefox: unsupported.

export function speechSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function ttsSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.speechSynthesis);
}

// Speak English text aloud (questions + model answers). Returns a stop fn.
export function speak(text) {
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.92;
    const voices = synth.getVoices();
    const en = voices.find((v) => v.lang?.toLowerCase().startsWith('en') && v.localService)
      || voices.find((v) => v.lang?.toLowerCase().startsWith('en'));
    if (en) u.voice = en;
    synth.speak(u);
    return () => synth.cancel();
  } catch {
    return () => {};
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // ignore
  }
}

// Live English transcription. Callbacks receive plain data; App owns scoring.
export function createRecognition({ lang = 'en-US', onInterim, onFinal, onEnd, onError }) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let running = false;
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) onFinal?.(r[0].transcript.trim(), Date.now());
      else interim += r[0].transcript;
    }
    if (interim) onInterim?.(interim);
  };
  rec.onerror = (e) => onError?.(e.error || 'unknown');
  rec.onend = () => {
    running = false;
    onEnd?.();
  };
  return {
    start() {
      if (running) return;
      running = true;
      rec.start();
    },
    stop() {
      try {
        rec.stop();
      } catch {
        // already stopped
      }
    },
    get running() {
      return running;
    },
  };
}
