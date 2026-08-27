export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isMe?: boolean;
}

export interface ChallengeSubmissionDto {
  code: string;
  userId?: string;
}

export interface ChallengeScoreResult {
  score: number;
  topScore: boolean;
  message: string;
  title: string;
  icon: string;
  unlockInterviewCourse: boolean;
}

export interface BootcampChallengeSummary {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: 'active' | 'open' | 'ended';
  points: number;
}

export interface BootcampState {
  rank: number;
  points: number;
  leaderboard: LeaderboardEntry[];
  cardTimerSeconds: number;
  challenges: BootcampChallengeSummary[];
}
