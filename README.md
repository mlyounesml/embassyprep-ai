# EmbassyPrep AI — Yahya Interview Coach

React + Vite static app. Record answers in the browser, transcribe with
OpenAI Whisper, evaluate with Google Gemini 2.5 Flash, retry until 80%+.

## Keys (never in code or git)

Keys are entered in the in-app **Keys** modal and live in that browser only.
Uncheck “remember on this device” on shared computers — keys then stay in
memory and vanish on reload. Format-checked (`sk-…`, `AIza…`).

**Recommended:** run the optional proxy in `server/proxy.example.js` so keys
never touch the browser at all, then build with:

```bash
VITE_PROXY_URL=https://your-proxy.example npm run build
```

## Parent consent

Recording is gated behind a parent/guardian consent screen (COPPA-style):
voice → OpenAI Whisper, text → Gemini, billed to your own keys.

## Run locally

```bash
npm.cmd install
npm.cmd run dev
```

## Build

```bash
npm.cmd run build   # static output in dist/, relative paths for any subpath
```

## Deploy

GitHub Actions (`.github/workflows/pages.yml`) builds and deploys `dist/`
to Pages on every push to `main`. One-time repo setup: Settings → Pages →
**Source: GitHub Actions**.

## Limits & cost guards

- Recordings cap at 2:00 and 24MB (Whisper hard limit is 25MB).
- 90s Whisper / 45s Gemini timeouts; one retry on 429/5xx only.
- Failed evaluations reuse the cached transcript — transcription is never
  billed twice for the same audio (“Evaluate again” button).
- Strict JSON-schema evaluation (`responseMimeType: application/json` +
  `responseSchema`); malformed scores throw instead of silently becoming 0.
