import { RotateCcw, GraduationCap } from 'lucide-react';

export default function Header({ onReset }) {
  return (
    <header className="bg-slate-900 text-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500">
          <GraduationCap size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">
            EmbassyPrep <span className="text-orange-400">AI</span>
          </h1>
          <p className="truncate text-sm text-slate-300">
            Yahya&apos;s interview coach — no keys, works in your browser
          </p>
        </div>
        <button
          onClick={onReset}
          title="Clear progress"
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </header>
  );
}
