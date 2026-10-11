export default function QuestionCard({ question, index, total, onListen }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-700">
          {question.category}
        </span>
        <span className="text-slate-400">
          Question {index + 1} / {total}
        </span>
      </div>
      <h2 className="text-xl font-bold text-slate-900">{question.en}</h2>
      {question.ar && <p className="mt-1 text-sm text-slate-500">{question.ar}</p>}
      <button
        onClick={onListen}
        className="mt-3 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
      >
        🔊 Listen to question
      </button>
      {question.tip && (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          💡 Tip: {question.tip}
        </p>
      )}
    </div>
  );
}
