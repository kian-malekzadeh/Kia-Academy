import { BIG_FIVE_TRAITS } from '../personality/types';
import type { LearnerTestReport } from '../types/test-report';

/** Mean of Mini-IPIP trait percents (0–100), or null when missing. */
export function personalityOverallPercent(
  personality: LearnerTestReport['personality'],
): number | null {
  if (!personality) return null;
  const values = BIG_FIVE_TRAITS.map((trait) => personality.scores[trait]?.percent ?? 0);
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

/**
 * Real overall score from the three-test sequence (0–100).
 * Averages available scored parts: Big Five overall + readiness exam average.
 * Goal assessment is profile data (not a percent grade) so it is omitted from the mean
 * but required presence is reflected via `threeTestProgressPercent`.
 */
export function computeOverallTestScore(report: LearnerTestReport): number | null {
  const parts: number[] = [];
  const personality = personalityOverallPercent(report.personality);
  if (personality != null) parts.push(personality);
  if (report.readiness) parts.push(report.readiness.average);
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((sum, n) => sum + n, 0) / parts.length);
}

/** Completion progress through the three tests (0 / 33 / 67 / 100). */
export function threeTestProgressPercent(report: LearnerTestReport): number {
  const done =
    (report.personality ? 1 : 0) +
    (report.assessment ? 1 : 0) +
    (report.readiness ? 1 : 0);
  return Math.round((done / 3) * 100);
}
