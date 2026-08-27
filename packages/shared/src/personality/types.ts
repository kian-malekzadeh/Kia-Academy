/** Big Five / OCEAN trait keys (Mini-IPIP / IPIP-FFM). */
export type BigFiveTrait =
  | 'extraversion'
  | 'agreeableness'
  | 'conscientiousness'
  | 'neuroticism'
  | 'openness';

export const BIG_FIVE_TRAITS: readonly BigFiveTrait[] = [
  'extraversion',
  'agreeableness',
  'conscientiousness',
  'neuroticism',
  'openness',
] as const;

/** Likert response: 1 = very inaccurate … 5 = very accurate. */
export type PersonalityLikert = 1 | 2 | 3 | 4 | 5;

export interface PersonalityItem {
  id: string;
  /** 1-based administration order in the Mini-IPIP form. */
  order: number;
  trait: BigFiveTrait;
  /** When true, score as (6 − response). */
  reverse: boolean;
  /** English stem (IPIP public-domain wording). */
  textEn: string;
  /** Persian translation for the fa locale. */
  textFa: string;
}

/** Mini-IPIP answer sheet keyed by item id (not wizard teamwork/pace). */
export type MiniIpipAnswers = Record<string, PersonalityLikert>;

export interface BigFiveTraitScore {
  trait: BigFiveTrait;
  /** Sum of 4 scored items (range 4–20). */
  raw: number;
  /** 0–100 normalized from raw. */
  percent: number;
}

export interface PersonalityResult {
  id: string;
  instrument: 'mini-ipip';
  /** Citation label for UI/docs. */
  citation: string;
  scores: Record<BigFiveTrait, BigFiveTraitScore>;
  answers: MiniIpipAnswers;
  createdAt: string;
}

export interface SubmitPersonalityDto {
  answers: MiniIpipAnswers;
}
