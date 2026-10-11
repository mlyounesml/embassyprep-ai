# EmbassyPrep AI — Yahya Interview Coach

React + Vite static app. Record answers in the browser, transcribe with
OpenAI Whisper, evaluate with Google Gemini 1.5 Flash, retry until 80%+.

## Keys (never in code)

Keys live only in the browser `localStorage`, entered via the in-app
**Keys** modal. Never commit them, never paste them in chat.

## Run locally

```bash
cd embassyprep-ai
npm.cmd install
npm.cmd run dev
```

## Static build (GitHub Pages ready)

```bash
npm.cmd run build
```

Output is `dist/` with relative asset paths (`base: './'`), so it works
from any Pages subpath. Upload `dist/` to Pages, or push this folder to a
repo and enable Pages on the `dist` output via an Action.

## Secure push (do NOT paste tokens in chat)

```bash
cd embassyprep-ai
git init
git add .
git commit -m "EmbassyPrep AI"
gh auth login
gh repo create embassyprep-ai --public --source=. --push
```

If `gh` is unavailable, create the repo on github.com and push with the
credential manager — never hardcode a PAT in commands or files.
