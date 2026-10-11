# EmbassyPrep AI — Yahya Interview Coach (keyless)

React + Vite static app. Practice US Embassy youth-exchange interview questions
with **zero API keys, zero accounts, zero cost**:

- 🎤 Record answers in the browser (playback included, Safari-friendly formats)
- 🗣️ Live transcription via the browser's built-in speech recognition (Chrome/Edge)
- ⌨️ Typed-answer mode for browsers without transcription
- 📊 Transparent on-device scoring: pace (wpm) · fillers · pauses · key points
- 🔊 Listen to every question and model answer (built-in speech synthesis)
- 🔁 Mastery loop (80%+), Skip button, per-question history, clickable progress
- 👪 Parent-consent gate before microphone use

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

## Honest limits

Scores are training estimates, not AI evaluation: grammar cannot be checked
on-device (the app says so openly and shows a model answer to imitate instead).
Chrome's built-in transcription may send voice snippets to Google servers
(browser behavior); typed mode avoids that entirely.
