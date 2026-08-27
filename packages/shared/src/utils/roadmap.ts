import { MODULE_PRICES, TRACKS } from '../constants/tracks';
import type { AssessmentAnswers } from '../types/assessment';
import type { RoadmapResponse, TrackKey } from '../types/roadmap';
import type { SitePricingSettings, SiteTrackSettings } from '../types/site-settings';

export type SkillLevelKey = 'absoluteBeginner' | 'confidentBeginner' | 'earlyIntermediate';

export interface BuildRoadmapOptions {
  tracks?: SiteTrackSettings[];
  pricing?: Pick<SitePricingSettings, 'modulePrices' | 'bundleDiscountPercent'>;
}

export function skillLevel(skills: AssessmentAnswers['skills']): SkillLevelKey {
  const vals = Object.values(skills);
  const score = vals.reduce((a, v) => a + (v === 'Never used' ? 0 : v === 'Beginner' ? 1 : 2), 0);
  if (score <= 1) return 'absoluteBeginner';
  if (score <= 4) return 'confidentBeginner';
  return 'earlyIntermediate';
}

function resolveTrack(
  key: string,
  tracks?: SiteTrackSettings[],
): { name: string; modules: string[] } {
  if (tracks?.length) {
    const found = tracks.find((t) => t.key === key) ?? tracks[0];
    if (found) return { name: found.name, modules: found.modules };
  }
  const fallback = TRACKS[key as TrackKey] ?? TRACKS.web;
  return { name: fallback.name, modules: fallback.modules };
}

export function buildRoadmapFromAnswers(
  answers: AssessmentAnswers,
  enrolled = false,
  id = 'local',
  options?: BuildRoadmapOptions,
): RoadmapResponse {
  const primary = (answers.interests[0] || options?.tracks?.[0]?.key || 'web') as TrackKey;
  const track = resolveTrack(primary, options?.tracks);
  const level = skillLevel(answers.skills);
  const modulePrices = options?.pricing?.modulePrices?.length
    ? options.pricing.modulePrices
    : MODULE_PRICES;
  const discountPercent = options?.pricing?.bundleDiscountPercent ?? 20;
  const total = modulePrices.reduce((a, b) => a + b, 0);
  const discounted = Math.round(total * (1 - discountPercent / 100));

  return {
    id,
    trackKey: primary,
    trackName: track.name,
    modules: track.modules,
    level,
    profile: {
      goal: answers.goal ?? '',
      level,
      style: answers.style ?? '',
      hours: answers.hours,
    },
    pricing: {
      individual: [...modulePrices],
      total,
      discounted,
    },
    enrolled,
  };
}
