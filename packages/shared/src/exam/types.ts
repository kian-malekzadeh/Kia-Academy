/** Real-time digital readiness exam — domains, types, and public shapes. */

export const EXAM_DOMAINS = [
  'digitalOps',
  'logicalReasoning',
  'techReading',
  'codeSense',
  'problemSolving',
] as const;

export type ExamDomainId = (typeof EXAM_DOMAINS)[number];

export const EXAM_DURATION_SEC = 30 * 60;
export const EXAM_PASS_THRESHOLD = 60;
export const EXAM_BLUEPRINT_VERSION = 'kia-readiness-v2';

export type ExamQuestionType = 'single_choice' | 'multi_choice' | 'order' | 'fill_blank';

export type LocaleText = { fa: string; en: string };

export interface ExamChoice {
  id: string;
  label: LocaleText;
}

/** Full question including grading key (server-only when serving attempts). */
export interface ExamQuestion {
  id: string;
  domain: ExamDomainId;
  type: ExamQuestionType;
  prompt: LocaleText;
  /** MCQ / multi options */
  options?: ExamChoice[];
  /** Ordering items (shuffled for client) */
  orderItems?: ExamChoice[];
  /** Number of blanks for fill_blank */
  blanks?: number;
  blankPlaceholders?: LocaleText[];
  /**
   * Grading key:
   * - single_choice: option id
   * - multi_choice: sorted option ids
   * - order: ordered item ids
   * - fill_blank: accepted answers per blank (lowercase)
   */
  answer: string | string[];
  points?: number;
}

export type PublicExamQuestion = Omit<ExamQuestion, 'answer'>;

export type ExamResponse =
  | { type: 'single_choice'; optionId: string }
  | { type: 'multi_choice'; optionIds: string[] }
  | { type: 'order'; orderedIds: string[] }
  | { type: 'fill_blank'; values: string[] };

export interface ExamAttemptSession {
  attemptId: string;
  blueprintVersion: string;
  durationSec: number;
  startedAt: string;
  endsAt: string;
  roadmapId: string | null;
  questions: PublicExamQuestion[];
  savedAnswers: Record<string, ExamResponse>;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
}

export interface ExamDomainScore {
  domain: ExamDomainId;
  correct: number;
  total: number;
  percent: number;
}

export interface ExamOutcome {
  passed: boolean;
  average: number;
  domainScores: Record<ExamDomainId, number>;
  weakDomains: ExamDomainId[];
  refreshersInserted: string[];
  modulesUnlocked: string[];
  levelBefore: string;
  levelAfter: string;
  roadmapId: string | null;
  roadmapModules: string[];
}

export interface ExamSubmitResult {
  attemptId: string;
  average: number;
  passed: boolean;
  domainScores: ExamDomainScore[];
  percentages: Record<string, number>;
  outcome: ExamOutcome;
  verdict: {
    icon: string;
    title: LocaleText;
    message: LocaleText;
    unlockTitle: LocaleText;
    unlockSub: LocaleText;
    variant: 'success' | 'warning';
  };
  submittedAt: string;
}

/** Legacy readiness module ids kept for older UI maps → new domains. */
export const LEGACY_READINESS_TO_DOMAIN: Record<string, ExamDomainId> = {
  computerLiteracy: 'digitalOps',
  englishReadiness: 'techReading',
  algorithmicThinking: 'logicalReasoning',
  flowcharts: 'logicalReasoning',
  programmingFundamentals: 'codeSense',
};
