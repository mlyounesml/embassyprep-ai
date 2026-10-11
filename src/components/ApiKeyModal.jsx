import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

export default function ApiKeyModal({ open, initial, onSave }) {
  const [openai, setOpenai] = useState(initial.openai || '');
  const [gemini, setGemini] = useState(initial.gemini || '');
  const [show, setShow] = useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">API Keys</h2>
          <button
            onClick={() => setShow((s) => !s)}
            className="rounded-lg bg-slate-100 p-2 text-slate-600"
            title="Show / hide"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Stored <b>only</b> in this browser (localStorage). Never committed to git.
          Leave a field empty to keep its saved value.
        </p>

        <label className="mb-1 block text-sm font-bold">OpenAI key (Whisper)</label>
        <input
          type={show ? 'text' : 'password'}
          value={openai}
          onChange={(e) => setOpenai(e.target.value)}
          placeholder="sk-... (empty = keep saved)"
          className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-bold">Gemini key (evaluation)</label>
        <input
          type={show ? 'text' : 'password'}
          value={gemini}
          onChange={(e) => setGemini(e.target.value)}
          placeholder="AIza... (empty = keep saved)"
          className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
        />

        <div className="flex gap-2">
          <button
            onClick={() => onSave({ openai, gemini })}
            className="flex-1 rounded-xl bg-orange-500 py-2.5 font-bold text-white hover:bg-orange-600"
          >
            Save keys
          </button>
        </div>
        <p className="mt-3 flex items-start gap-1 text-xs text-slate-400">
          <X size={13} className="mt-0.5 shrink-0" />
          Get keys from OpenAI dashboard and Google AI Studio on your own device. Never share
          them in chat or screenshots.
        </p>
      </div>
    </div>
  );
}
