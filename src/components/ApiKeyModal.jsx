import { useEffect, useState } from 'react';
import { X, Eye, EyeOff, LogOut } from 'lucide-react';
import { isValidOpenAIKey, isValidGeminiKey } from '../utils/storage.js';

export default function ApiKeyModal({ open, initial, canClose, remember, onSave, onClear, onClose }) {
  const [openai, setOpenai] = useState('');
  const [gemini, setGemini] = useState('');
  const [keep, setKeep] = useState(true);
  const [show, setShow] = useState(false);

  // Re-sync every time the modal opens (props may change while closed).
  useEffect(() => {
    if (open) {
      setOpenai(initial.openai || '');
      setGemini(initial.gemini || '');
      setKeep(remember);
      setShow(false);
    }
  }, [open, initial, remember]);

  if (!open) return null;

  const openaiOk = !openai.trim() || isValidOpenAIKey(openai);
  const geminiOk = !gemini.trim() || isValidGeminiKey(gemini);
  const canSave = (openai.trim() || initial.openai) && (gemini.trim() || initial.gemini) && openaiOk && geminiOk;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">API Keys</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setShow((s) => !s)}
              className="rounded-lg bg-slate-100 p-2 text-slate-600"
              title="Show / hide"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {canClose && (
              <button
                onClick={onClose}
                className="rounded-lg bg-slate-100 p-2 text-slate-600"
                title="Close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Keys are used from <b>this browser only</b> and never put in code or git. Uncheck
          “remember” on a shared device — keys then live in memory and vanish on reload.
        </p>

        <label className="mb-1 block text-sm font-bold">OpenAI key (Whisper)</label>
        <input
          type={show ? 'text' : 'password'}
          value={openai}
          onChange={(e) => setOpenai(e.target.value)}
          placeholder="sk-... (empty = keep saved)"
          autoComplete="off"
          className={`mb-1 w-full rounded-lg border px-3 py-2 text-sm ${openaiOk ? '' : 'border-red-400'}`}
        />
        {!openaiOk && <p className="mb-2 text-xs text-red-600">Looks wrong — OpenAI keys start with “sk-”.</p>}

        <label className="mb-1 mt-2 block text-sm font-bold">Gemini key (evaluation)</label>
        <input
          type={show ? 'text' : 'password'}
          value={gemini}
          onChange={(e) => setGemini(e.target.value)}
          placeholder="AIza... (empty = keep saved)"
          autoComplete="off"
          className={`mb-1 w-full rounded-lg border px-3 py-2 text-sm ${geminiOk ? '' : 'border-red-400'}`}
        />
        {!geminiOk && <p className="mb-2 text-xs text-red-600">Looks wrong — Gemini keys start with “AIza”.</p>}

        <label className="mb-4 mt-2 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
          Remember keys on this device
        </label>

        <div className="flex gap-2">
          <button
            onClick={() => canSave && onSave({ openai, gemini, remember: keep })}
            disabled={!canSave}
            className="flex-1 rounded-xl bg-orange-500 py-2.5 font-bold text-white hover:bg-orange-600 disabled:opacity-40"
          >
            Save keys
          </button>
          {(initial.openai || initial.gemini) && (
            <button
              onClick={onClear}
              title="Delete saved keys from this browser"
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200"
            >
              <LogOut size={15} /> Forget
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Get keys from the OpenAI dashboard and Google AI Studio on your own device. Never share
          them in chat or screenshots. Prefer the optional self-hosted proxy (see README) so keys
          never touch the browser at all.
        </p>
      </div>
    </div>
  );
}
