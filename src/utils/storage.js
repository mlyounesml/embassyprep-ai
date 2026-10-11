// API key + progress + consent persistence.
// Keys live in this browser only. The key modal offers a session-only
// (memory) mode so nothing is written to disk on shared devices.

const OPENAI_KEY = 'embassyprep_openai_key';
const GEMINI_KEY = 'embassyprep_gemini_key';
const RESULTS_KEY = 'embassyprep_results_v2';
const CONSENT_KEY = 'embassyprep_consent_v1';

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

// Attempts: { [index]: { score, mastered, skipped, transcript, evaluation, at } }
export function loadResults() {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
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

export function hasConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'yes';
  } catch {
    return false;
  }
}

export function saveConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, 'yes');
  } catch {
    // non-fatal
  }
}

export function isValidOpenAIKey(v) {
  return /^sk-(proj-)?[A-Za-z0-9-_]{10,}$/.test((v || '').trim());
}

export function isValidGeminiKey(v) {
  return /^AIza[0-9A-Za-z-_]{20,}$/.test((v || '').trim());
}
