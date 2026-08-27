import { describe, expect, it } from 'vitest';
import { computeOverallTestScore, personalityOverallPercent, threeTestProgressPercent } from './test-report-score';
import type { LearnerTestReport } from '../types/test-report';

function report(partial: Partial<LearnerTestReport>): LearnerTestReport {
  return {
    personality: null,
    assessment: null,
    readiness: null,
    roadmap: null,
    ...partial,
  };
}

describe('test-report-score', () => {
  it('averages Big Five trait percents', () => {
    const personality = {
      id: 'p',
      instrument: 'mini-ipip' as const,
      citation: 'c',
      answers: {},
      createdAt: '2026-01-01T00:00:00.000Z',
      scores: {
        extraversion: { trait: 'extraversion' as const, raw: 12, percent: 50 },
        agreeableness: { trait: 'agreeableness' as const, raw: 12, percent: 50 },
        conscientiousness: { trait: 'conscientiousness' as const, raw: 12, percent: 50 },
        neuroticism: { trait: 'neuroticism' as const, raw: 12, percent: 50 },
        openness: { trait: 'openness' as const, raw: 10, percent: 38 },
      },
    };
    expect(personalityOverallPercent(personality)).toBe(48);
  });

  it('computes overall from personality + readiness only', () => {
    const r = report({
      personality: {
        id: 'p',
        instrument: 'mini-ipip',
        citation: 'c',
        answers: {},
        createdAt: '2026-01-01T00:00:00.000Z',
        scores: {
          extraversion: { trait: 'extraversion', raw: 16, percent: 75 },
          agreeableness: { trait: 'agreeableness', raw: 16, percent: 75 },
          conscientiousness: { trait: 'conscientiousness', raw: 16, percent: 75 },
          neuroticism: { trait: 'neuroticism', raw: 16, percent: 75 },
          openness: { trait: 'openness', raw: 16, percent: 75 },
        },
      },
      assessment: {
        id: 'a',
        answers: {
          goal: 'job',
          skills: {},
          personality: { teamwork: 50, pace: 50 },
          interests: ['web'],
          style: 'building',
          hours: 10,
        },
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      readiness: {
        id: 'e',
        createdAt: '2026-01-01T00:00:00.000Z',
        percentages: {},
        average: 85,
        passed: true,
        verdict: {
          icon: '✓',
          title: 'ok',
          message: 'ok',
          unlockTitle: 'ok',
          unlockSub: 'ok',
          variant: 'success',
        },
      },
    });
    // (75 + 85) / 2 = 80
    expect(computeOverallTestScore(r)).toBe(80);
    expect(threeTestProgressPercent(r)).toBe(100);
  });

  it('returns null when no scored tests exist', () => {
    expect(computeOverallTestScore(report({}))).toBeNull();
    expect(threeTestProgressPercent(report({}))).toBe(0);
  });
});
