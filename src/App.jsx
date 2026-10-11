import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Loader2, FastForward, RefreshCw } from 'lucide-react';
import Header from './components/Header.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import AudioRecorder from './components/AudioRecorder.jsx';
import FeedbackCard from './components/FeedbackCard.jsx';
import ProgressTracker from './components/ProgressTracker.jsx';
import ApiKeyModal from './components/ApiKeyModal.jsx';
import ConsentModal from './components/ConsentModal.jsx';
import { transcribeAudio } from './services/whisperService.js';
import { evaluateAnswer } from './services/geminiService.js';
import {
  getKeys,
  saveKeys,
  clearKeys,
  loadResults,
  saveResults,
  clearResults,
  hasConsent,
  saveConsent,
} from './utils/storage.js';

const QUESTIONS = [
  {
    category: 'Embassy · Motive',
    en: 'Why do you want to join this youth exchange program?',
    ar: 'ليه عايز تشترك في برنامج التبادل؟',
    tip: 'Link English + new friends + future study. 3 short sentences.',
  },
  {
    category: 'Embassy · Home ties',
    en: 'Tell us about your school life in Egypt.',
    ar: 'احكي عن حياتك المدرسية في مصر.',
    tip: 'Name grade, favorite subject, one activity.',
  },
  {
    category: 'Embassy · Future',
    en: 'What do you want to study or become in the future?',
    ar: 'نفسك تدرس إيه أو تبقى إيه؟',
    tip: 'One dream job + how English helps it.',
  },
  {
    category: 'Embassy · Culture',
    en: 'If you meet an American student your age, what will you tell him about Egypt?',
    ar: 'لو قابلت طالب أمريكي، هتحكيله إيه عن مصر؟',
    tip: 'History + food + kind people. Show pride.',
  },
  {
    category: 'Embassy · Adaptation',
    en: 'What would you like to learn about other cultures?',
    ar: 'تحب تعرف إيه عن الثقافات التانية؟',
    tip: 'Their thinking, language, youth interests.',
  },
  {
    category: 'Yahya · Volunteering',
    en: 'You volunteer at Resala Charity. What do you do there?',
    ar: 'بتعمل إيه في تطوع رسالة؟',
    tip: 'Use: "I volunteer at Resala to help people in need. I help pack bags and sort clothes."',
  },
  {
    category: 'Yahya · Teamwork',
    en: 'If a teammate does not participate in a group project, what will you do?',
    ar: 'لو زميلك مش بيشارك في مشروع جماعي هتعمل إيه؟',
    tip: 'Encourage + split the task + succeed together.',
  },
  {
    category: 'Yahya · Hobbies',
    en: 'What do you do in your free time? Tell us about football, boxing, chess, or gaming.',
    ar: 'بتعمل إيه في وقت فراغك؟',
    tip: 'Pick 1-2 real hobbies + what each teaches you.',
  },
  {
    category: 'Yahya · Challenge',
    en: 'What is your biggest challenge in English right now?',
    ar: 'إيه أصعب حاجة في الإنجليزي دلوقتي؟',
    tip: 'Honest + positive: "I understand well, but I hesitate when I speak fast."',
  },
  {
    category: 'Yahya · AI learning',
    en: 'How do you use AI tools to learn?',
    ar: 'بتستخدم الذكاء الاصطناعي إزاي في التعلم؟',
    tip: 'Tool for ideas and explanations — YOU decide and execute.',
  },
];

const STATUS_LABEL = {
  Idle: 'Idle — press Record',
  Recording: 'Recording… speak clearly',
  Transcribing: 'Transcribing with Whisper…',
  Evaluating: 'Evaluating with Gemini…',
  Complete: 'Complete — check feedback',
};

export default function App() {
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState('Idle');
  const [results, setResults] = useState(() => loadResults());
  const [keys, setKeys] = useState(() => getKeys());
  const [remember, setRemember] = useState(true);
  const [showKeys, setShowKeys] = useState(false);
  const [consented, setConsented] = useState(() => hasConsent());
  const [error, setError] = useState('');
  const lastBlobRef = useRef(null);

  useEffect(() => {
    const k = getKeys();
    if (!k.openai || !k.gemini) setShowKeys(true);
  }, []);

  const question = QUESTIONS[current];
  const attempt = results[current] || {};
  const transcript = attempt.transcript || '';
  const evaluation = attempt.evaluation || null;
  const locked = Boolean(evaluation && !evaluation.mastered && !attempt.skipped);
  const busy = status === 'Transcribing' || status === 'Evaluating' || status === 'Recording';

  function activeKeys() {
    // Memory-only mode: keys live in state, never touch disk.
    return keys;
  }

  function persist(next) {
    setResults(next);
    saveResults(next);
  }

  function setAttempt(i, patch) {
    persist({ ...results, [i]: { ...(results[i] || {}), ...patch, at: Date.now() } });
  }

  function handleSaveKeys({ openai, gemini, remember: keep }) {
    const prev = getKeys();
    const next = {
      openai: (openai.trim() || (keep ? prev.openai : keys.openai)).trim(),
      gemini: (gemini.trim() || (keep ? prev.gemini : keys.gemini)).trim(),
    };
    setRemember(keep);
    if (keep) saveKeys(next);
    else clearKeys();
    setKeys(next);
    setError('');
    if (next.openai && next.gemini) setShowKeys(false);
    else setError('Both keys are required to start.');
  }

  function handleClearKeys() {
    clearKeys();
    setKeys({ openai: '', gemini: '' });
    setShowKeys(true);
  }

  async function runPipeline(blob, i) {
    const k = activeKeys();
    if (!k.openai || !k.gemini) {
      setShowKeys(true);
      setError('Add both API keys first (Keys button).');
      setStatus('Idle');
      return;
    }
    try {
      setStatus('Transcribing');
      // Fresh recording: always transcribe. A failed *evaluation* later
      // reuses the cached transcript and never bills Whisper twice.
      const text = await transcribeAudio(blob, PROXY_MODE ? '' : k.openai);
      lastBlobRef.current = { blob, text };
      setAttempt(i, { transcript: text });
      setStatus('Evaluating');
      const ev = await evaluateAnswer(QUESTIONS[i].en, text, PROXY_MODE ? '' : k.gemini);
      setAttempt(i, { transcript: text, evaluation: ev, score: ev.fluencyScore, mastered: ev.mastered, skipped: false });
      setStatus('Complete');
    } catch (e) {
      setStatus('Idle');
      setError(e.message || 'Pipeline failed.');
    }
  }

  function handleRecordingComplete(blob) {
    setError('');
    lastBlobRef.current = null;
    runPipeline(blob, current);
  }

  function handleEvaluateAgain() {
    setError('');
    const b = lastBlobRef.current;
    if (!b?.blob) {
      setError('No saved recording — record an answer first.');
      return;
    }
    if (!transcript) {
      runPipeline(b.blob, current);
      return;
    }
    // Transcript cached: only the (cheaper) Gemini step runs again.
    const k = activeKeys();
    if (!k.gemini) {
      setShowKeys(true);
      return;
    }
    setStatus('Evaluating');
    evaluateAnswer(question.en, transcript, PROXY_MODE ? '' : k.gemini)
      .then((ev) => {
        setAttempt(current, { evaluation: ev, score: ev.fluencyScore, mastered: ev.mastered, skipped: false });
        setStatus('Complete');
      })
      .catch((e) => {
        setStatus('Idle');
        setError(e.message || 'Evaluation failed.');
      });
  }

  function resetAttempt() {
    lastBlobRef.current = null;
    const { ...rest } = results;
    delete rest[current];
    persist(rest);
    setError('');
    setStatus('Idle');
  }

  function skipQuestion() {
    setAttempt(current, { skipped: true });
    setError('');
    setStatus('Idle');
    if (current < QUESTIONS.length - 1) setCurrent(current + 1);
  }

  function goTo(i) {
    if (busy || i < 0 || i >= QUESTIONS.length) return;
    lastBlobRef.current = null;
    setCurrent(i);
    setError('');
    setStatus('Idle');
  }

  function handleResetAll() {
    clearResults();
    setResults({});
    lastBlobRef.current = null;
    setError('');
    setStatus('Idle');
    setCurrent(0);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header onOpenKeys={() => setShowKeys(true)} onReset={handleResetAll} />

      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
        <ProgressTracker
          questions={QUESTIONS}
          results={results}
          current={current}
          onSelect={goTo}
          disabled={busy}
        />

        <QuestionCard question={question} index={current} total={QUESTIONS.length} />

        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          {busy && <Loader2 size={16} className="animate-spin" />}
          Status: {STATUS_LABEL[status]}
        </div>

        <AudioRecorder
          key={current}
          status={status}
          onRecordingStart={() => {
            setError('');
            setStatus('Recording');
          }}
          onComplete={(blob) => handleRecordingComplete(blob)}
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
            {lastBlobRef.current && (
              <button
                onClick={handleEvaluateAgain}
                className="ml-2 inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700"
              >
                <RefreshCw size={13} /> {transcript ? 'Evaluate again (no re-record)' : 'Transcribe again (no re-record)'}
              </button>
            )}
          </div>
        )}

        {transcript && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <span className="font-bold text-slate-500">Transcript: </span>
            <span className="text-slate-800">{transcript}</span>
          </div>
        )}

        <FeedbackCard transcript={transcript} evaluation={evaluation} />

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
            title="Clear this attempt and record again"
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
            🔒 Fluency {evaluation.fluencyScore}% is below 80%. Read the orange box aloud twice and
            press “Retry question” — or press “Skip” to continue and come back later.
          </p>
        )}

        <footer className="pb-8 pt-2 text-center text-xs text-slate-400">
          Audio → OpenAI Whisper, text → Gemini {PROXY_MODE ? 'via your private proxy' : 'directly'} —
          one request per step, failed evaluations never re-bill transcription. No keys in code or
          git. Parental consent required before recording.
        </footer>
      </main>

      <ConsentModal open={!consented} onAccept={() => { saveConsent(); setConsented(true); }} />
      <ApiKeyModal
        open={showKeys}
        initial={remember ? getKeys() : keys}
        canClose={Boolean(activeKeys().openai && activeKeys().gemini)}
        remember={remember}
        onSave={handleSaveKeys}
        onClear={handleClearKeys}
        onClose={() => setShowKeys(false)}
      />
    </div>
  );
}

// True when the app routes API calls through a self-hosted proxy
// (VITE_PROXY_URL set at build time) instead of calling providers directly.
const PROXY_MODE = Boolean(import.meta.env.VITE_PROXY_URL);
