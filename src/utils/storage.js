// Progress + consent persistence. No keys exist anywhere in this app.

const RESULTS_KEY = 'embassyprep_keyless_v1';
const CONSENT_KEY = 'embassyprep_consent_v1';

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
