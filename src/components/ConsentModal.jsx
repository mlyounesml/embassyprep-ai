import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ConsentModal({ open, onAccept }) {
  const [checked, setChecked] = useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <ShieldCheck size={20} />
          </span>
          <h2 className="text-lg font-bold">Parent consent</h2>
        </div>
        <div className="mb-4 space-y-2 text-sm text-slate-600">
          <p>
            EmbassyPrep AI records Yahya&apos;s voice in the browser. Each evaluation sends the{' '}
            <b>audio to OpenAI Whisper</b> (speech-to-text) and the <b>text to Google Gemini</b>{' '}
            (feedback). Requests are billed to your own API keys.
          </p>
          <p>
            Recordings stay in this browser&apos;s memory and are never uploaded anywhere else by
            this app. No account, no tracking, no ads.
          </p>
        </div>
        <label className="mb-4 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1"
          />
          I am Yahya&apos;s parent/guardian and I consent to this voice processing for practice.
        </label>
        <button
          onClick={() => checked && onAccept()}
          disabled={!checked}
          className="w-full rounded-xl bg-orange-500 py-2.5 font-bold text-white hover:bg-orange-600 disabled:opacity-40"
        >
          I consent — start practicing
        </button>
      </div>
    </div>
  );
}
