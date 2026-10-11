import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Loader2, FastForward, Keyboard } from 'lucide-react';
import QUESTIONS from './data/questions.js';
import Header from './components/Header.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import AudioRecorder from './components/AudioRecorder.jsx';
import FeedbackCard from './components/FeedbackCard.jsx';
import ProgressTracker from './components/ProgressTracker.jsx';
import ConsentModal from './components/ConsentModal.jsx';
import { analyzeAnswer } from './services/localEval.js';
import {
  speechSupported,
  createRecognition,
  speak,
  stopSpeaking,
} from './services/browserSpeech.js';
import {
  loadResults,
  saveResults,
  clearResults,
  hasConsent,
  saveConsent,
} from './utils/storage.js';

const STATUS_LABEL = {
  Idle: 'Idle — press Record',
  Listening: 'Listening… speak clearly',
  Scoring: 'Scoring on your device…',
  Complete: 'Complete — check feedback',
};

const PAUSE_GAP_MS = 1500;

export default function App() {
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState('Idle');
  const [results, setResults] = useState(() => loadResults());
  const [consented, setConsented] = useState(() => hasConsent());
  const [error, setError] = useState('');
  const [interim, setInterim] = useState('');
  const [typed, setTyped] = useState('');
  const recRef = useRef(null);
  const finalsRef = useRef([]);
  const supported = speechSupported();

  useEffect(() => () => stopSpeaking(), []);

  const question = QUESTIONS[current];
  const attempt = results[current] || {};
  const transcript = attempt.transcript || '';
  const evaluation = attempt.evaluation || null;
  const locked = Boolean(evaluation && !evaluation.mastered && !attempt.skipped);
  const busy = status === 'Listening' || status === 'Scoring';

  function persist(next) {
    setResults(next);
    saveResults(next);
  }

  function setAttempt(i, patch) {
    persist({ ...results, [i]: { ...(results[i] || {}), ...patch, at: Date.now() } });
  }

  function startRecognition() {
    finalsRef.current = [];
    setInterim('');
    const rec = createRecognition({
      onInterim: (t) => setInterim(t),
      onFinal: (text, at) => {
        const arr = finalsRef.current;
        if (arr.length > 0 && at - arr[arr.length - 1].at > PAUSE_GAP_MS) {
          arr.pauses = (arr.pauses || 0) + 1;
        }
        arr.push({ text, at });
      },
      onEnd: () => {
        // onend fires after stop(); finalize only if we were scoring.
        setStatus((s) => {
          if (s === 'Scoring') setTimeout(finalize, 0);
          return s;
        });
      },
      onError: (code) => {
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          setError('Microphone blocked for transcription. Allow mic access and retry.');
          setStatus('Idle');
        } else if (code === 'network') {
          setError('Transcription needs internet (browser service). Check connection and retry.');
          setStatus('Idle');
        }
        // 'no-speech' / 'aborted' → onend path handles it
      },
    });
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setError('Could not start transcription. Type your answer below instead.');
    }
  }

  function finalize() {
    const finals = finalsRef.current;
    const text = finals.map((f) => f.text).join(' ').trim();
    setInterim('');
    if (!text) {
      setError('No speech detected — speak louder/closer, or type your answer below.');
      setStatus('Idle');
      return;
    }
    const durationSec =
      finals.length > 1
        ? Math.max(1, Math.round((finals[finals.length - 1].at - finals[0].at) / 1000))
        : Math.max(1, Math.round(text.split(/\s+/).length / 2));
    const ev = analyzeAnswer({
      transcript: text,
      durationSec,
      pauseCount: finals.pauses || 0,
      keywords: question.keywords,
    });
    setAttempt(current, {
      transcript: text,
      evaluation: ev,
      score: ev.fluencyScore,
      mastered: ev.mastered,
      skipped: false,
    });
    setStatus('Complete');
  }

  function handleRecordingStart() {
    setError('');
    stopSpeaking();
    setStatus('Listening');
    startRecognition();
  }

  function handleStopRecording() {
    // Stop transcription, then score from collected finals.
    setStatus('Scoring');
    try {
      recRef.current?.stop();
    } catch {
      // fall through
    }
    // Safety net if onend never fires.
    setTimeout(() => {
      setStatus((s) => {
        if (s === 'Scoring') setTimeout(finalize, 0);
        return s;
      });
    }, 2000);
  }

  function handleAnalyzeTyped() {
    const text = typed.trim();
    if (words(text) < 3) {
      setError('Type at least a full sentence, then analyze.');
      return;
    }
    setError('');
    const ev = analyzeAnswer({ transcript: text, durationSec: null, pauseCount: 0, keywords: question.keywords });
    setAttempt(current, {
      transcript: text,
      evaluation: ev,
      score: ev.fluencyScore,
      mastered: ev.mastered,
      skipped: false,
    });
    setStatus('Complete');
  }

  function words(t) {
    return t.trim() ? t.trim().split(/\s+/).length : 0;
  }

  function resetAttempt() {
    const { ...rest } = results;
    delete rest[current];
    persist(rest);
    setTyped('');
    setInterim('');
    setError('');
    setStatus('Idle');
  }

  function skipQuestion() {
    setAttempt(current, { skipped: true });
    setTyped('');
    setInterim('');
    setError('');
    setStatus('Idle');
    if (current < QUESTIONS.length - 1) setCurrent(current + 1);
  }

  function goTo(i) {
    if (busy || i < 0 || i >= QUESTIONS.length) return;
    stopSpeaking();
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
    setCurrent(i);
    setTyped('');
    setInterim('');
    setError('');
    setStatus('Idle');
  }

  function handleResetAll() {
    clearResults();
    setResults({});
    setTyped('');
    setInterim('');
    setError('');
    setStatus('Idle');
    setCurrent(0);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header onReset={handleResetAll} />

      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
        <ProgressTracker
          questions={QUESTIONS}
          results={results}
          current={current}
          onSelect={goTo}
          disabled={busy}
        />

        <QuestionCard
          question={question}
          index={current}
          total={QUESTIONS.length}
          onListen={() => speak(question.en)}
        />

        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          {busy && <Loader2 size={16} className="animate-spin" />}
          Status: {STATUS_LABEL[status]}
        </div>

        {supported ? (
          <AudioRecorder
            key={current}
            status={status}
            onRecordingStart={handleRecordingStart}
            onStopRecording={handleStopRecording}
          />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-bold text-amber-800">
              <Keyboard size={15} className="mr-1 inline" />
              Your browser has no built-in transcription (use Chrome/Edge for voice mode).
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Type Yahya&apos;s answer below — scoring works the same, only pace timing is skipped.
            </p>
          </div>
        )}

        {(interim || status === 'Listening') && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            {interim ? <>Hearing: “{interim}…”</> : 'Listening… start speaking.'}
          </div>
        )}

        {(!supported || status === 'Complete' || transcript) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-1 block text-sm font-bold text-slate-600">
              {supported ? 'Or type the answer instead:' : 'Type the answer:'}
            </label>
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              rows={3}
              placeholder="Type Yahya's answer in English here…"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <button
              onClick={handleAnalyzeTyped}
              disabled={busy}
              className="mt-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              Analyze typed answer
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {transcript && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <span className="font-bold text-slate-500">Transcript: </span>
            <span className="text-slate-800">{transcript}</span>
          </div>
        )}

        <FeedbackCard
          transcript={transcript}
          evaluation={evaluation}
          modelAnswer={question.model}
          onListenModel={() => speak(question.model)}
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => goTo(current - 1)}
            disabled={current === 0 || busy}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Prev
          </button>
          <button
            onClick={resetAttempt}
            disabled={busy}
            title="Clear this attempt and try again"
            className="flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-40"
          >
            <RotateCcw size={16} /> Retry question
          </button>
          <button
            onClick={skipQuestion}
            disabled={busy || current >= QUESTIONS.length - 1}
            title="Skip without mastering — marked grey, never blocks progress"
            className="flex items-center gap-2 rounded-xl bg-slate-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            <FastForward size={16} /> Skip
          </button>
          <button
            onClick={() => goTo(current + 1)}
            disabled={current >= QUESTIONS.length - 1 || locked || busy}
            title={locked ? 'Score 80%+ or Skip to continue' : 'Next question'}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            Next <ArrowRight size={16} />
          </button>
        </div>

        {locked && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            🔒 Fluency {evaluation.fluencyScore}% is below 80%. Read the model answer aloud twice
            and press “Retry question” — or press “Skip” and come back later.
          </p>
        )}

        <footer className="pb-8 pt-2 text-center text-xs text-slate-400">
          Keyless practice: transcription + scoring happen in this browser. No accounts, no cost.
          Scores are training estimates (pace · fillers · pauses · key points) — not an official
          evaluation.
        </footer>
      </main>

      <ConsentModal open={!consented} onAccept={() => { saveConsent(); setConsented(true); }} />
    </div>
  );
}
