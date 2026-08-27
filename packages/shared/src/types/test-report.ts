import type { AssessmentResponse } from './assessment';
import type { ExamOutcome, LocaleText } from '../exam/types';
import type { PersonalityResult } from '../personality/types';

/** Combined learner report for the three-test sequence. */
export interface LearnerTestReportReadiness {
  id: string;
  createdAt: string;
  percentages: Record<string, number>;
  average: number;
  passed: boolean;
  /** May be bilingual (exam) or plain strings (legacy readiness). */
  verdict: {
    icon: string;
    title: string | LocaleText;
    message: string | LocaleText;
    unlockTitle: string | LocaleText;
    unlockSub: string | LocaleText;
    variant: 'success' | 'warning';
  };
  outcome?: ExamOutcome;
}

export interface LearnerTestReportRoadmap {
  id: string;
  trackKey: string;
  trackName: string;
  level: string;
  profile: {
    goal: string;
    level: string;
    style: string;
    hours: number;
  };
}

/**
 * Full report after personality + goal assessment + readiness exam.
 * Sections may be null when a learner only retakes the exam, or when
 * older accounts lack a stored personality/assessment row.
 */
export interface LearnerTestReport {
  personality: PersonalityResult | null;
  assessment: AssessmentResponse | null;
  readiness: LearnerTestReportReadiness | null;
  roadmap: LearnerTestReportRoadmap | null;
}
