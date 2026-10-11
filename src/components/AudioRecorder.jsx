import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function AudioRecorder({ status, onComplete, onRecordingStart }) {
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const recording = status === 'Recording';

  useEffect(() => () => stopTracks(), []);

  function stopTracks() {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : undefined;
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onComplete(blob, url, seconds);
        stopTracks();
      };
      rec.start();
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      onRecordingStart();
    } catch {
      setError('Microphone blocked. Allow mic access in the browser and retry.');
    }
  }

  function stop() {
    clearInterval(timerRef.current);
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop();
  }

  function discard() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSeconds(0);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {!recording ? (
          <button
            onClick={start}
            disabled={status === 'Transcribing' || status === 'Evaluating'}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Mic size={18} /> Record answer
          </button>
        ) : (
          <button
            onClick={stop}
            className="rec-pulse flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
          >
            <Square size={18} /> Stop ({formatTime(seconds)})
          </button>
        )}

        {recording && (
          <div className="flex h-8 items-end gap-1" aria-hidden>
            {[0.5, 0.9, 0.4, 1, 0.6, 0.8, 0.45, 0.95, 0.55, 0.75, 0.4, 0.85].map((d, i) => (
              <span
                key={i}
                className="wave-bar w-1.5 rounded bg-orange-500"
                style={{ height: `${Math.round(d * 28)}px`, animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>
        )}

        {audioUrl && !recording && (
          <button
            onClick={discard}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200"
          >
            <Trash2 size={15} /> Discard
          </button>
        )}
      </div>

      {audioUrl && !recording && (
        <audio controls src={audioUrl} className="mt-3 w-full" />
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-slate-400">
        Saved only in memory — transcription sends audio to OpenAI Whisper once per evaluation.
      </p>
    </div>
  );
}
