// API key + progress persistence. Keys live ONLY in the user's browser.
// Nothing here hardcodes any secret.

const OPENAI_KEY = 'embassyprep_openai_key';
const GEMINI_KEY = 'embassyprep_gemini_key';
const RESULTS_KEY = 'embassyprep_results_v1';

export function getKeys() {
  try {
    return {
      openai: localStorage.getItem(OPENAI_KEY) || '',
      gemini: localStorage.getItem(GEMINI_KEY) || '',
    };
  } catch {
    return { openai: '', gemini: '' };
  }
}

export function saveKeys({ openai, gemini }) {
  localStorage.setItem(OPENAI_KEY, (openai || '').trim());
  localStorage.setItem(GEMINI_KEY, (gemini || '').trim());
}

export function clearKeys() {
  localStorage.removeItem(OPENAI_KEY);
  localStorage.removeItem(GEMINI_KEY);
}

export function hasKeys() {
  const { openai, gemini } = getKeys();
  return Boolean(openai && gemini);
}

export function loadResults() {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveResults(results) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch {
    // storage full / private mode — non-fatal
  }
}

export function clearResults() {
  localStorage.removeItem(RESULTS_KEY);
}
