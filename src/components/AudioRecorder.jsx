import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { extensionFor } from '../services/whisperService.js';

export const MAX_SECONDS = 120; // 2-minute cap keeps recordings far under the 25MB Whisper limit

function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function pickMime() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const c of candidates) {
    try {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      // ignore and try next
    }
  }
  return '';
}

function isSecureContextOk() {
  if (typeof window === 'undefined') return true;
  const { protocol, hostname } = window.location;
  return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
}

const BARS = 12;

export default function AudioRecorder({ status, onComplete, onRecordingStart }) {
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [levels, setLevels] = useState(() => new Array(BARS).fill(0.1));
  const [error, setError] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const urlRef = useRef(null);
  const recording = status === 'Recording';

  // Revoke any object URL when the question changes (remount) or unmounts.
  useEffect(
    () => () => {
      stopTracks();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function stopTracks() {
    clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
  }

  function watchLevels(stream) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const bars = [];
        for (let i = 0; i < BARS; i++) {
          const v = data[Math.floor((i * data.length) / BARS)] / 255;
          bars.push(0.08 + v * 0.92);
        }
        setLevels(bars);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Levels are decoration — recording works without them.
    }
  }

  async function start() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot access the microphone. Use Chrome or Edge on HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || mime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setAudioUrl(url);
        setLevels(new Array(BARS).fill(0.1));
        onComplete(blob, url, type);
        stopTracks();
      };
      rec.start();
      watchLevels(stream);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stop();
            setError('Stopped at the 2-minute limit. Short answers score higher anyway.');
            return s;
          }
          return s + 1;
        });
      }, 1000);
      onRecordingStart();
    } catch {
      setError('Microphone blocked. Allow mic access in the browser and retry (needs HTTPS).');
    }
  }

  function stop() {
    clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop();
  }

  function discard() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setAudioUrl(null);
    setSeconds(0);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {!isSecureContextOk() && (
        <p className="mb-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
          ⚠️ This page is not on HTTPS — browsers block the microphone on plain HTTP. Open the
          HTTPS link instead.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {!recording ? (
          <button
            onClick={start}
            disabled={status === 'Transcribing' || status === 'Evaluating'}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Mic size={18} /> Record answer (max 2:00)
          </button>
        ) : (
          <button
            onClick={stop}
            className="rec-pulse flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
          >
            <Square size={18} /> Stop ({formatTime(seconds)} / 2:00)
          </button>
        )}

        {recording && (
          <div className="flex h-8 items-end gap-1" aria-label="Microphone level" role="img">
            {levels.map((v, i) => (
              <span
                key={i}
                className="w-1.5 rounded bg-orange-500 transition-[height]"
                style={{ height: `${Math.max(3, Math.round(v * 28))}px` }}
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

      {audioUrl && !recording && <audio controls src={audioUrl} className="mt-3 w-full" />}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-slate-400">
        Format: {extensionFor(pickMime() || 'audio/webm')} · kept in memory only · sent to Whisper
        once per evaluation.
      </p>
    </div>
  );
}
