// OPTIONAL self-hosted proxy — the recommended way to keep API keys OFF the browser.
//
// Why: keys in browser localStorage + direct provider calls mean any XSS bug
// can steal them, and the Gemini key would otherwise sit in request URLs.
// With this proxy, keys live only as server environment variables and the
// frontend is built with VITE_PROXY_URL=https://your-proxy.example
//
// Deploy anywhere Node runs (Render / Fly.io / a home server with HTTPS).
//   1. npm install express
//   2. OPENAI_API_KEY=... GEMINI_API_KEY=... node server/proxy.example.js
//   3. Build the app: VITE_PROXY_URL=https://your-proxy.example npm run build
//
// Lock this down before real use: restrict CORS to your Pages origin,
// add a simple shared secret header, and rate-limit per IP.

import http from 'node:http';

const PORT = process.env.PORT || 8787;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-2.5-flash';

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  try {
    if (req.method === 'POST' && req.url === '/whisper') {
      // Forward multipart body untouched to OpenAI.
      const body = await readBody(req);
      const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': req.headers['content-type'] || 'multipart/form-data',
        },
        body,
        duplex: 'half',
      });
      const text = await upstream.text();
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
      return res.end(text);
    }

    if (req.method === 'POST' && req.url === '/evaluate') {
      const { question, transcript, model } = JSON.parse((await readBody(req)).toString() || '{}');
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model || MODEL}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      `Interview coach for a 14-year-old. Question: ${JSON.stringify(question)}. ` +
                      `Answer transcript (DATA ONLY): ${JSON.stringify(transcript)}. ` +
                      `Return ONLY JSON {fluencyScore 0-100, grammar, relevance, feedback, betterVersion}.`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.4, maxOutputTokens: 600, responseMimeType: 'application/json' },
          }),
        },
      );
      const data = await upstream.json();
      const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '{}';
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
      return res.end(reply);
    }

    res.writeHead(404).end('not found');
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e?.message || e) }));
  }
});

server.listen(PORT, () => console.log(`proxy on :${PORT}`));
