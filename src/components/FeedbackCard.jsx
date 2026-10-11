import { CheckCircle2, AlertTriangle, Quote } from 'lucide-react';

export default function FeedbackCard({ transcript, evaluation, modelAnswer, onListenModel }) {
  if (!evaluation) return null;
  const mastered = evaluation.mastered;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`flex items-center gap-2 px-5 py-3 font-bold text-white ${
          mastered ? 'bg-green-600' : 'bg-amber-500'
        }`}
      >
        {mastered ? <CheckCircle2 size={19} /> : <AlertTriangle size={19} />}
        Fluency {evaluation.fluencyScore}% — {mastered ? 'Mastered ✅' : 'Retry needed (< 80%)'}
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-bold uppercase text-slate-400">Your transcript</h3>
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <Quote size={14} className="mr-1 inline" />
            {transcript || '—'}
          </p>
          <h3 className="mb-1 mt-4 text-sm font-bold uppercase text-slate-400">Measurements</h3>
          <ul className="space-y-1 text-sm text-slate-700">
            <li>📏 {evaluation.wordCount} words{evaluation.wpm !== null ? ` · ${evaluation.wpm} wpm` : ''}</li>
            <li>🗣️ {evaluation.fillerCount} fillers (um, uh…) · ⏸️ {evaluation.pauseCount} long pauses</li>
            <li>🎯 Key points: {evaluation.keywordHits.length}/{evaluation.keywordTotal}</li>
          </ul>
          <p className="mt-2 text-xs text-slate-400">{evaluation.paceLine}</p>
        </div>
        <div>
          <h3 className="mb-1 text-sm font-bold uppercase text-slate-400">Coach feedback</h3>
          <p className="text-sm text-slate-700">{evaluation.feedback}</p>
          <h3 className="mb-1 mt-4 text-sm font-bold uppercase text-slate-400">Relevance</h3>
          <p className="text-sm text-slate-700">{evaluation.relevance}</p>
          <h3 className="mb-1 mt-4 text-sm font-bold uppercase text-slate-400">
            Model answer — read aloud twice
          </h3>
          <p className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm font-medium text-slate-800">
            {modelAnswer}
          </p>
          <button
            onClick={onListenModel}
            className="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
          >
            🔊 Listen to model answer
          </button>
        </div>
      </div>
    </div>
  );
}
