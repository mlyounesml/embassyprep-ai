export default function ProgressTracker({ questions, results, current }) {
  const mastered = Object.values(results).filter((r) => r?.mastered).length;
  const pct = questions.length ? Math.round((mastered / questions.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold text-slate-700">
          Progress: {mastered} / {questions.length} mastered
        </span>
        <span className="font-bold text-orange-600">{pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-orange-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const r = results[i];
          const cls = i === current
            ? 'bg-slate-900 text-white'
            : r?.mastered
              ? 'bg-green-500 text-white'
              : r
                ? 'bg-amber-400 text-white'
                : 'bg-slate-100 text-slate-500';
          return (
            <span key={i} title={q.en} className={`rounded-md px-2 py-1 text-xs font-bold ${cls}`}>
              {i + 1}
            </span>
          );
        })}
      </div>
    </div>
  );
}
