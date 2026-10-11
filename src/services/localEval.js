// 100% on-device answer scoring — no network, no keys, no cost.
// Transparent heuristic: pace + completeness + key points + fillers + pauses.

const FILLERS = ['um', 'uh', 'umm', 'uhm', 'erm', 'er', 'ah', 'يعني', 'امم', 'اه', 'ااه'];

function countFillers(text) {
  const words = (text || '').toLowerCase().replace(/[.,!?؟،]/g, ' ').split(/\s+/);
  let n = 0;
  for (const w of words) {
    if (FILLERS.includes(w)) n++;
  }
  return n;
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// durationSec may be null in typed mode (no timing measured).
export function analyzeAnswer({ transcript, durationSec, pauseCount, keywords }) {
  const text = (transcript || '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = (durationSec || 0) / 60;
  const wpm = minutes > 0 && words > 0 ? Math.round(words / minutes) : null;

  // Pace: learner sweet spot ~70–140 wpm, peak 100. Gentle slope — a good
  // answer must never fail on pace alone.
  const paceScore = wpm === null ? 70 : clamp(100 - Math.abs(wpm - 100) * 0.9);
  const lengthScore = clamp((words / 25) * 100);

  const keys = keywords || [];
  const lower = text.toLowerCase();
  const hits = keys.filter((k) => lower.includes(k.toLowerCase()));
  const keywordScore = keys.length ? clamp((hits.length / keys.length) * 100) : 70;

  const fillers = countFillers(text);
  const fillerScore = clamp(100 - fillers * 12);
  const pauses = pauseCount || 0;
  const pauseScore = clamp(100 - pauses * 10);

  const fluencyScore = clamp(
    paceScore * 0.25 + lengthScore * 0.2 + keywordScore * 0.2 + fillerScore * 0.2 + pauseScore * 0.15,
  );

  const paceLine =
    wpm === null
      ? 'Typed mode — pace not measured. Aim for ~100 words per minute when speaking.'
      : `Pace ${wpm} wpm${wpm < 80 ? ' — a bit slow, push a little faster' : wpm > 150 ? ' — very fast, slow down slightly' : ' — nice pace'}.`;

  const feedback =
    `You said ${words} words` +
    (wpm !== null ? ` in ${Math.round(durationSec)}s (${wpm} wpm)` : '') +
    `, ${fillers} filler${fillers === 1 ? '' : 's'}, ${pauses} long pause${pauses === 1 ? '' : 's'}` +
    `, ${hits.length}/${keys.length} key points. ` +
    (fluencyScore >= 80
      ? 'Excellent — fluent and complete! 🎉'
      : 'Good effort! Read the model answer aloud twice, then retry.');

  return {
    fluencyScore,
    wpm,
    wordCount: words,
    fillerCount: fillers,
    pauseCount: pauses,
    keywordHits: hits,
    keywordTotal: keys.length,
    grammar:
      'On-device practice cannot check grammar — compare your answer with the model answer and imitate its sentences.',
    relevance:
      keys.length
        ? `You covered ${hits.length} of ${keys.length} key points${hits.length ? `: ${hits.join(', ')}` : '. Mention the missing ones next try.'}`
        : 'Answer recorded.',
    paceLine,
    feedback,
    mastered: fluencyScore >= 80,
  };
}
