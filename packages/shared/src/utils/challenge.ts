import type { ChallengeScoreResult } from '../types/bootcamp';
import type { SiteBootcampSettings } from '../types/site-settings';

export function scoreFizzBuzz(code: string): number {
  let score = 0;
  if (/%\s*3/.test(code)) score += 25;
  if (/%\s*5/.test(code)) score += 25;
  if (/Fizz/.test(code) && /Buzz/.test(code)) score += 25;
  if (!/else if|else\s*{/.test(code) && code.trim().length > 40) score += 25;
  return score;
}

export function buildChallengeResult(
  code: string,
  settings?: Partial<SiteBootcampSettings>,
): ChallengeScoreResult {
  const score = scoreFizzBuzz(code);
  const unlockThreshold = settings?.unlockScoreThreshold ?? 75;
  const topScore = score >= unlockThreshold;

  if (topScore) {
    return {
      score,
      topScore,
      icon: '🏆',
      title: 'New personal best!',
      message: `You scored ${score}% — enough to take #1 this week. The Interview & Branding course just unlocked in My Courses.`,
      unlockInterviewCourse: true,
    };
  }

  return {
    score,
    topScore,
    icon: '✅',
    title: 'Submission scored!',
    message: `You scored ${score}%. Keep iterating — the leaderboard resets in 2d 14h.`,
    unlockInterviewCourse: false,
  };
}
