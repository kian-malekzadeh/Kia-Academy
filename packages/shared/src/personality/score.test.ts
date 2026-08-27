import { describe, expect, it } from 'vitest';
import { MINI_IPIP_ITEMS } from './bank';
import { missingMiniIpipAnswers, scoreMiniIpip } from './score';
import type { MiniIpipAnswers, PersonalityLikert } from './types';

function all(value: PersonalityLikert): MiniIpipAnswers {
  return Object.fromEntries(MINI_IPIP_ITEMS.map((item) => [item.id, value]));
}

describe('scoreMiniIpip', () => {
  it('reports missing items', () => {
    expect(missingMiniIpipAnswers({})).toHaveLength(20);
    expect(missingMiniIpipAnswers(all(3))).toHaveLength(0);
  });

  it('scores all-max answers with reverse keys applied', () => {
    const result = scoreMiniIpip(all(5));
    // Each trait: 2 forward (5+5) + 2 reverse (1+1) for E/A/C/N;
    // Openness: 1 forward (5) + 3 reverse (1+1+1) = 8
    expect(result.scores.extraversion.raw).toBe(12);
    expect(result.scores.agreeableness.raw).toBe(12);
    expect(result.scores.conscientiousness.raw).toBe(12);
    expect(result.scores.neuroticism.raw).toBe(12);
    expect(result.scores.openness.raw).toBe(8);
  });

  it('scores all-min answers', () => {
    const result = scoreMiniIpip(all(1));
    // E/A/C/N: 2×1 + 2×5 = 12; Openness: 1×1 + 3×5 = 16
    expect(result.scores.extraversion.raw).toBe(12);
    expect(result.scores.openness.raw).toBe(16);
  });

  it('throws when incomplete', () => {
    expect(() => scoreMiniIpip({ 'mipip-01': 3 })).toThrow(/Incomplete/);
  });
});
