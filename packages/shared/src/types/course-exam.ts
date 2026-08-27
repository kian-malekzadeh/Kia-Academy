/** Course-exam shared types — for admin-authored exams inside a course. */

export type CourseExamQuestionType = 'single_choice' | 'multi_choice';

export interface CourseExamChoice {
  id: string;
  label: string;
}

/** Full question including the grading key (server-side). */
export interface CourseExamQuestion {
  id: string;
  type: CourseExamQuestionType;
  prompt: string;
  options: CourseExamChoice[];
  /** Correct option id (single) or correct option ids (multi). */
  answer: string | string[];
  points?: number;
}

/** Question served to a learner during an attempt — grading key stripped. */
export type PublicCourseExamQuestion = Omit<CourseExamQuestion, 'answer'>;

export type CourseExamResponse =
  | { type: 'single_choice'; optionId: string }
  | { type: 'multi_choice'; optionIds: string[] };

/** A course exam as surfaced to admins (full question payload). */
export interface AdminCourseExam {
  id: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  description: string;
  passScore: number;
  durationMin: number;
  published: boolean;
  sortOrder: number;
  questions: CourseExamQuestion[];
  createdAt: string;
  updatedAt: string;
}

/** Public summary of a course exam (admin list / learner listing). */
export interface CourseExamSummary {
  id: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  description: string;
  passScore: number;
  durationMin: number;
  published: boolean;
  sortOrder: number;
  questionCount: number;
}

/** An active learner attempt session (questions without grading keys). */
export interface CourseExamAttemptSession {
  attemptId: string;
  examId: string;
  examTitle: string;
  courseSlug: string;
  durationMin: number;
  passScore: number;
  startedAt: string;
  endsAt: string;
  questions: PublicCourseExamQuestion[];
  savedAnswers: Record<string, CourseExamResponse>;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
}

export interface CourseExamScoreDetail {
  questionId: string;
  correct: boolean;
  points: number;
}

/** Result returned on submit / fetch of a submitted attempt. */
export interface CourseExamSubmitResult {
  attemptId: string;
  examId: string;
  examTitle: string;
  courseSlug: string;
  score: number;
  passed: boolean;
  passScore: number;
  correctCount: number;
  totalCount: number;
  details: CourseExamScoreDetail[];
  submittedAt: string;
}

/** Learner summary of attempts for one course exam. */
export interface CourseExamAttemptSummary {
  id: string;
  examId: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
}
