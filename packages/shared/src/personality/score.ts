import { MINI_IPIP_CITATION, MINI_IPIP_ITEMS } from './bank';
import {
  BIG_FIVE_TRAITS,
  type BigFiveTrait,
  type BigFiveTraitScore,
  type MiniIpipAnswers,
  type PersonalityItem,
  type PersonalityLikert,
  type PersonalityResult,
} from './types';

const LIKERT_MIN = 1;
const LIKERT_MAX = 5;

export function isPersonalityLikert(value: unknown): value is PersonalityLikert {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= LIKERT_MIN &&
    value <= LIKERT_MAX
  );
}

/** Returns missing item ids, or empty when the answer sheet is complete. */
export function missingMiniIpipAnswers(
  answers: MiniIpipAnswers,
  items: readonly PersonalityItem[] = MINI_IPIP_ITEMS,
): string[] {
  return items.filter((item) => !isPersonalityLikert(answers[item.id])).map((item) => item.id);
}

function scoredValue(response: PersonalityLikert, reverse: boolean): number {
  return reverse ? LIKERT_MAX + LIKERT_MIN - response : response;
}

function toPercent(raw: number, itemCount: number): number {
  const rawMin = itemCount * LIKERT_MIN;
  const rawMax = itemCount * LIKERT_MAX;
  if (rawMax <= rawMin) return 0;
  return Math.round(((raw - rawMin) / (rawMax - rawMin)) * 100);
}

/**
 * Score a completed Mini-IPIP answer sheet.
 * Throws if any item is missing or out of range.
 * Pass custom `items` when the bank is loaded from the database.
 */
export function scoreMiniIpip(
  answers: MiniIpipAnswers,
  opts?: { id?: string; createdAt?: string; items?: readonly PersonalityItem[] },
): PersonalityResult {
  const items = opts?.items ?? MINI_IPIP_ITEMS;
  const missing = missingMiniIpipAnswers(answers, items);
  if (missing.length) {
    throw new Error(`Incomplete Mini-IPIP answers: missing ${missing.join(', ')}`);
  }

  const rawByTrait: Record<BigFiveTrait, number> = {
    extraversion: 0,
    agreeableness: 0,
    conscientiousness: 0,
    neuroticism: 0,
    openness: 0,
  };
  const countByTrait: Record<BigFiveTrait, number> = {
    extraversion: 0,
    agreeableness: 0,
    conscientiousness: 0,
    neuroticism: 0,
    openness: 0,
  };

  for (const item of items) {
    const response = answers[item.id]!;
    rawByTrait[item.trait] += scoredValue(response, item.reverse);
    countByTrait[item.trait] += 1;
  }

  const scores = {} as Record<BigFiveTrait, BigFiveTraitScore>;
  for (const trait of BIG_FIVE_TRAITS) {
    const raw = rawByTrait[trait];
    const count = countByTrait[trait] || 1;
    scores[trait] = { trait, raw, percent: toPercent(raw, count) };
  }

  return {
    id: opts?.id ?? 'local',
    instrument: 'mini-ipip',
    citation: MINI_IPIP_CITATION,
    scores,
    answers: { ...answers },
    createdAt: opts?.createdAt ?? new Date().toISOString(),
  };
}
