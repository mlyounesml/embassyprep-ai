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
            This practice app uses <b>only the browser</b>: microphone recording, on-screen
            playback, built-in speech transcription, and on-device scoring. There are{' '}
            <b>no accounts, no API keys, no paid services, no tracking, no ads</b>.
          </p>
          <p>
            Note: in Chrome, the built-in transcription feature may send voice snippets to Google
            servers (browser behavior, not this app). Nothing is stored anywhere by us.
          </p>
        </div>
        <label className="mb-4 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1"
          />
          I am Yahya&apos;s parent/guardian and I allow microphone practice in this browser.
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
