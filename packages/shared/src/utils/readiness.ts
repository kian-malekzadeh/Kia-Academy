import { READINESS_MODULES } from '../constants/tracks';
import type { ReadinessResult, ReadinessScores } from '../types/readiness';
import type { SiteReadinessSettings } from '../types/site-settings';

/** Legacy English labels and stable keys → canonical readiness module keys. */
export const READINESS_MODULE_LEGACY_TO_KEY: Record<string, string> = {
  'Computer Literacy': 'computerLiteracy',
  'English Readiness': 'englishReadiness',
  'Algorithmic Thinking': 'algorithmicThinking',
  Flowcharts: 'flowcharts',
  'Programming Fundamentals': 'programmingFundamentals',
  computerLiteracy: 'computerLiteracy',
  englishReadiness: 'englishReadiness',
  algorithmicThinking: 'algorithmicThinking',
  flowcharts: 'flowcharts',
  programmingFundamentals: 'programmingFundamentals',
};

export function normalizeReadinessModuleKey(key: string): string {
  return READINESS_MODULE_LEGACY_TO_KEY[key] ?? key;
}

export function computeReadinessResult(
  scores: ReadinessScores,
  settings?: Partial<SiteReadinessSettings>,
): ReadinessResult {
  const percentages: Record<string, number> = {};
  READINESS_MODULES.forEach((m) => {
    const direct = scores[m];
    const legacyHit = Object.entries(scores).find(
      ([k]) => normalizeReadinessModuleKey(k) === m,
    )?.[1];
    const s = direct || legacyHit || { correct: 0, total: 1 };
    percentages[m] = Math.round((s.correct / s.total) * 100);
  });
  const avg = Math.round(
    Object.values(percentages).reduce((a, b) => a + b, 0) / READINESS_MODULES.length,
  );
  const passThreshold = settings?.passThreshold ?? 60;
  const passed = avg >= passThreshold;

  if (passed) {
    const title = settings?.passTitle ?? "You're ready for the next module";
    const messageBody =
      settings?.passMessage ??
      'Your roadmap has been adjusted — the next module in your sequence is now unlocked.';
    return {
      percentages,
      average: avg,
      passed,
      verdict: {
        icon: '✅',
        title,
        message: `Overall score: ${avg}%. ${messageBody}`,
        unlockTitle: title,
        unlockSub: 'Your roadmap has been updated — pick up where you left off.',
        variant: 'success',
      },
    };
  }

  const title = settings?.failTitle ?? 'Almost there — one review module first';
  const messageBody =
    settings?.failMessage ??
    "We'll slot in a short refresher before unlocking the next stage, so you start it feeling confident.";
  return {
    percentages,
    average: avg,
    passed,
    verdict: {
      icon: '🧭',
      title,
      message: `Overall score: ${avg}%. ${messageBody}`,
      unlockTitle: 'A quick refresher is queued up',
      unlockSub: "It's short — about 20 minutes — then you're straight back on track.",
      variant: 'warning',
    },
  };
}
