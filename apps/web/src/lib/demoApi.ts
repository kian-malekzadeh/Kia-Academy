import type {
  AssessmentAnswers,
  AuthResponse,
  AuthTokens,
  AuthUser,
  CartItemResponse,
  CartResponse,
  ChallengeScoreResult,
  CheckoutDto,
  ContactFormDto,
  ContactFormResponse,
  CourseExamAttemptSession,
  CourseExamAttemptSummary,
  CourseExamQuestion,
  CourseExamResponse,
  CourseExamSubmitResult,
  CourseExamSummary,
  CourseSummary,
  CreateChallengeDto,
  CreateCourseDto,
  CreateLessonDto,
  GatewayVerifyDto,
  GatewayVerifyResponse,
  InvoiceResponse,
  LearnerState,
  LessonDetail,
  LessonSummary,
  LoginDto,
  OrderResponse,
  PaymentResponse,
  ExamAttemptSession,
  ExamResponse,
  ExamSubmitResult,
  LearnerTestReport,
  MiniIpipAnswers,
  PersonalityResult,
  AssessmentResponse,
  ReadinessResult,
  ReadinessScores,
  ReadinessTestSummary,
  RegisterDto,
  RoadmapResponse,
  SiteSettings,
  UpdateChallengeDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateSiteSettingsDto,
  UserRole,
  AdminStats,
  AdminCourse,
  AdminLesson,
  AdminChallenge,
  AdminContactMessage,
  AdminCreateUserDto,
  AdminUser,
  AdminPayment,
  SiteAdminAccessSettings,
  AssessmentBank,
  PersonalityBank,
  ReadinessBank,
  TestBankId,
  TestBankMeta,
  TestBankPayload,
  SupportTicketSummary,
  SupportTicketDetail,
  CreateTicketDto,
  TicketReplyDto,
  LearnerMessageDto,
  LearnerTodoDto,
  CreateTodoDto,
  UpdateTodoDto,
  CompetitionSummary,
  CourseAttachmentDto,
  LearnerProgressSummary,
  ProfileDetails,
  UpdateProfileDto,
  BootcampState,
} from '@kia-academy/shared';
import { courseCatalog, primaryCourseSlug } from '@/lib/courseCatalog';
import {
  buildRoadmapFromAnswers,
  computeReadinessResult,
  buildChallengeResult,
  createDefaultSiteSettings,
  mergeSiteSettings,
  toPublicSiteSettings,
  DEFAULT_ASSESSMENT_BANK,
  MINI_IPIP_CITATION,
  MINI_IPIP_ITEMS,
  normalizeAdminAccess,
  EXAM_BLUEPRINT_VERSION,
  EXAM_DURATION_SEC,
  EXAM_QUESTION_BANK,
  buildExamOutcome,
  buildExamVerdict,
  gradeAttempt,
  scoreMiniIpip,
  toPublicExamQuestions,
} from '@kia-academy/shared';
import { ApiError } from '@/lib/apiError';
import { clearTokens, setAccessToken } from '@/lib/auth';

const DEMO_SESSION_KEY = 'kia-academy-demo-session';
const DEMO_STATE_KEY = 'kia-academy-demo-state';
const DEMO_SETTINGS_KEY = 'kia-academy-demo-settings';
const DEMO_TEST_BANKS_KEY = 'kia-academy-demo-test-banks';

const DEMO_LEARNER: AuthUser = {
  id: 'demo-learner',
  name: 'Alex R.',
  email: 'alex@kia.academy',
  phone: '09120000001',
  role: 'LEARNER',
  profileComplete: true,
};

const DEMO_ADMIN: AuthUser = {
  id: 'demo-admin',
  name: 'Kia Academy Super Admin',
  email: 'admin@kia.academy',
  phone: null,
  role: 'SUPER_ADMIN',
  profileComplete: true,
};

const DEMO_CREATED_AT = '2026-01-01T00:00:00.000Z';

let demoTodos: LearnerTodoDto[] = [];
let demoCompetitions: CompetitionSummary[] = [
  {
    id: 'demo-comp-1',
    slug: 'spring-code-sprint',
    title: 'Spring Code Sprint',
    description: 'A timed algorithm sprint for Kia learners.',
    startsAt: DEMO_CREATED_AT,
    endsAt: '2026-12-31T00:00:00.000Z',
    active: true,
    registered: false,
  },
];

let demoAdminUsers: AdminUser[] = [
  {
    id: DEMO_LEARNER.id,
    name: DEMO_LEARNER.name,
    email: DEMO_LEARNER.email,
    phone: DEMO_LEARNER.phone,
    role: DEMO_LEARNER.role,
    createdAt: DEMO_CREATED_AT,
  },
  {
    id: DEMO_ADMIN.id,
    name: DEMO_ADMIN.name,
    email: DEMO_ADMIN.email,
    phone: DEMO_ADMIN.phone,
    role: DEMO_ADMIN.role,
    createdAt: DEMO_CREATED_AT,
  },
];

interface DemoLesson {
  id: string;
  slug: string;
  title: string;
  durationMin: number;
  content: string;
  sortOrder: number;
  videoUrl: string | null;
}

interface DemoCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  trackKey: string | null;
  sortOrder: number;
  published: boolean;
  lessons: DemoLesson[];
}

interface DemoPersistedState {
  enrollments: string[];
  completedLessons: string[];
  hasRoadmap: boolean;
  roadmapEnrolled: boolean;
  readinessPaid: boolean;
  testCompleted: boolean;
  entitlements: string[];
  roadmapId: string | null;
  lastAnswers: AssessmentAnswers | null;
  payments: PaymentResponse[];
  cartCourseSlugs: string[];
  orders: OrderResponse[];
  examAttempt: {
    attemptId: string;
    startedAt: string;
    endsAt: string;
    answers: Record<string, ExamResponse>;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
    result?: ExamSubmitResult;
  } | null;
  personalityResult: PersonalityResult | null;
  roadmapModules: string[] | null;
  roadmapLevel: string | null;
}

function lessonKey(courseSlug: string, lessonSlug: string): string {
  return `${courseSlug}/${lessonSlug}`;
}

function defaultCourses(): DemoCourse[] {
  const fromDb: DemoCourse[] = courseCatalog.map((course) => ({
    id: `course-${course.slug}`,
    slug: course.slug,
    title: course.title,
    description: course.description,
    icon: course.icon,
    trackKey: course.trackKey,
    sortOrder: course.sortOrder,
    published: true,
    lessons: course.lessons.map((lesson) => ({
      id: `lesson-${course.slug}-${lesson.slug}`,
      slug: lesson.slug,
      title: lesson.title,
      durationMin: lesson.durationMin,
      videoUrl: lesson.videoUrl,
      sortOrder: lesson.sortOrder,
      content: lesson.content,
    })),
  }));

  return [
    ...fromDb,
    {
      id: 'course-interview',
      slug: 'interview-branding',
      title: 'Interview & Personal Branding',
      description: 'Build a standout portfolio, resume, and interview story that gets you hired.',
      icon: 'briefcase',
      trackKey: 'web',
      sortOrder: 100,
      published: true,
      lessons: [
        {
          id: 'lesson-iv-1',
          slug: 'portfolio-story',
          title: 'Portfolio Story',
          durationMin: 14,
          videoUrl: null,
          sortOrder: 1,
          content: `# Portfolio Story

Your portfolio should tell a clear story: **who you are**, *what you build*, and why it matters.

## A case study that recruiters read

1. **Context** — one sentence on the product and your role.
2. **Problem** — the constraint or user pain you targeted.
3. **Solution** — what you shipped, with \`key metrics\` (e.g. *+34% signup*).
4. **Reflection** — what you would do differently next time.

## Checklist

- Hero section with role + value proposition
- 2–3 featured projects with outcomes
- Contact link and GitHub profile

> Tip: recruiters skim for ~90 seconds. Put outcomes *before* tooling lists.

Host the site for free with [GitHub Pages](https://pages.github.com/).`,
        },
        {
          id: 'lesson-iv-2',
          slug: 'interview-framework',
          title: 'Interview Framework',
          durationMin: 16,
          videoUrl: null,
          sortOrder: 2,
          content: `# Interview Framework

Use **STAR** (Situation, Task, Action, Result) to answer behavioral questions.

## Run the STAR loop

1. *Situation* — set the scene in two sentences max.
2. *Task* — state your specific responsibility.
3. *Action* — say what **you** did, not the team.
4. *Result* — quantify it, then link it to the role.

## Tips

- Lead with impact, not tools
- Quantify results when possible
- Prepare 3 project deep-dives

> Practice out loud: a strong answer fits in \`90 seconds\`.

Review the STAR method on [Wikipedia](https://en.wikipedia.org/wiki/Situation,_Task,_Action,_Result) before your next mock interview.`,
        },
      ],
    },
  ];
}

let courses = defaultCourses();
let challenges: AdminChallenge[] = [
  {
    id: 'challenge-fizzbuzz',
    slug: 'fizzbuzz',
    title: 'FizzBuzz Sprint',
    description: 'Implement classic FizzBuzz and climb the bootcamp leaderboard.',
    points: 100,
    startsAt: new Date(Date.now() - 86400000).toISOString(),
    endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    active: true,
    starterCode: 'function fizzbuzz(n) {\n  \n}',
  },
];

function readSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeSession(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    clearTokens();
    return;
  }
  sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
  setAccessToken('demo-access-token');
}

function defaultState(): DemoPersistedState {
  return {
    enrollments: [primaryCourseSlug],
    completedLessons: [],
    hasRoadmap: true,
    roadmapEnrolled: false,
    readinessPaid: false,
    testCompleted: false,
    entitlements: courseCatalog.map((c) => `course:${c.slug}`),
    roadmapId: 'demo-roadmap',
    lastAnswers: {
      goal: 'job',
      interests: ['web'],
      skills: { html: 'Beginner', css: 'Beginner', js: 'Never used', python: 'Never used' },
      hours: 8,
      style: 'building',
      personality: { teamwork: 60, pace: 55 },
    },
    payments: [],
    cartCourseSlugs: [],
    orders: [],
    examAttempt: null,
    personalityResult: null,
    roadmapModules: null,
    roadmapLevel: null,
  };
}

function readState(): DemoPersistedState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...(JSON.parse(raw) as DemoPersistedState) };
  } catch {
    return defaultState();
  }
}

function writeState(state: DemoPersistedState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
}

function requireUser(): AuthUser {
  const user = readSession();
  if (!user) throw new ApiError('Unauthorized', 401);
  return user;
}

function learnerStateFor(user: AuthUser): LearnerState {
  const state = readState();
  return {
    user,
    hasRoadmap: state.hasRoadmap,
    roadmapEnrolled: state.roadmapEnrolled,
    readinessPaid: state.readinessPaid,
    testCompleted: state.testCompleted,
    profileComplete: user.profileComplete,
    entitlements: state.entitlements,
    enrollments: state.enrollments,
  };
}

function toCourseSummary(course: DemoCourse): CourseSummary {
  const state = readState();
  const enrolled = state.enrollments.includes(course.slug);
  const completed = course.lessons.filter((l) =>
    state.completedLessons.includes(lessonKey(course.slug, l.slug)),
  ).length;
  const progressPct =
    course.lessons.length === 0 ? 0 : Math.round((completed / course.lessons.length) * 100);
  // Entering a course resumes at the next lesson after the last completed one;
  // when the whole course is done we loop back to the first lesson.
  const firstLessonSlug =
    course.lessons.find(
      (l) => !state.completedLessons.includes(lessonKey(course.slug, l.slug)),
    )?.slug ??
    course.lessons[0]?.slug ??
    null;
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    icon: course.icon,
    trackKey: course.trackKey,
    lessonCount: course.lessons.length,
    enrolled,
    progressPct,
    firstLessonSlug,
  };
}

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

function buildDemoCart(state: DemoPersistedState): CartResponse {
  const settings = readDemoSettings();
  const unitPrice = settings.pricing.courseCents;
  const siteName = settings.general.siteName || 'Kia Academy';
  const trackMap = new Map(settings.tracks.map((t) => [t.key, t.name]));
  const items: CartItemResponse[] = [];
  for (const slug of state.cartCourseSlugs) {
    const course = courses.find((c) => c.slug === slug);
    if (!course) continue;
    if (state.enrollments.includes(slug)) continue;
    const priceCents = unitPrice;
    const discountCents = 0;
    items.push({
      id: `cart-item-${course.id}`,
      courseId: course.id,
      courseSlug: course.slug,
      title: course.title,
      thumbnail: course.icon || '📘',
      instructor: (course.trackKey && trackMap.get(course.trackKey)) || siteName,
      trackKey: course.trackKey,
      priceCents,
      discountCents,
      finalPriceCents: priceCents - discountCents,
      addedAt: DEMO_CREATED_AT,
    });
  }
  const subtotalCents = items.reduce((s, i) => s + i.priceCents, 0);
  const discountCents = items.reduce((s, i) => s + i.discountCents, 0);
  const totalCents = items.reduce((s, i) => s + i.finalPriceCents, 0);
  return {
    id: 'demo-cart',
    items,
    itemCount: items.length,
    subtotalCents,
    discountCents,
    totalCents,
    currency: settings.payment.currency,
    updatedAt: new Date().toISOString(),
  };
}

function authResponse(user: AuthUser): AuthResponse {
  writeSession(user);
  return { user, accessToken: 'demo-access-token', expiresIn: 3600 };
}

/* ------------------------------------------------------------------ *
 * Course exams (demo parity with the real course-exams service).
 * Persisted under a dedicated key so the existing demo state stays untouched.
 * ------------------------------------------------------------------ */

interface DemoStoredExam {
  id: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  title: string;
  description: string;
  passScore: number;
  durationMin: number;
  sortOrder: number;
  questions: CourseExamQuestion[];
}

interface DemoStoredAttempt {
  attemptId: string;
  examId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  passed: boolean | null;
  answers: Record<string, CourseExamResponse>;
}

const EXAM_STORE_KEY = 'kia-demo-course-exams-v1';

const DEMO_EXAMS: DemoStoredExam[] = [
  {
    id: 'demo-exam-js-01',
    courseId: 'course-js-basics',
    courseSlug: 'js-basics',
    courseTitle: 'جاوااسکریپت پایه',
    title: 'آزمون جامع جاوااسکریپت',
    description: 'پوشش همهٔ ماژول‌های دوره: متغیرها، توابع، آرایه‌ها، رویدادها و DOM.',
    passScore: 60,
    durationMin: 10,
    sortOrder: 0,
    questions: [
      {
        id: 'q1', type: 'single_choice',
        prompt: 'خروجی کد زیر چیست؟\n\nlet x = 5; { let x = 10; } console.log(x);',
        options: [
          { id: 'a', label: '۵' },
          { id: 'b', label: '۱۰' },
          { id: 'c', label: 'undefined' },
          { id: 'd', label: 'خطای ReferenceError' },
        ],
        answer: 'a',
      },
      {
        id: 'q2', type: 'single_choice',
        prompt: 'کدام روش آرایه، یک آرایهٔ جدید برمی‌گرداند و آرایهٔ اصلی را تغییر نمی‌دهد؟',
        options: [
          { id: 'a', label: 'push' },
          { id: 'b', label: 'map' },
          { id: 'c', label: 'splice' },
          { id: 'd', label: 'sort' },
        ],
        answer: 'b',
      },
      {
        id: 'q3', type: 'multi_choice',
        prompt: 'کدام گزینه‌ها مقادیر falsy در جاوااسکریپت هستند؟',
        options: [
          { id: 'a', label: '۰ (صفر)' },
          { id: 'b', label: "'' (رشتهٔ خالی)" },
          { id: 'c', label: '[] (آرایهٔ خالی)' },
          { id: 'd', label: 'NaN' },
        ],
        answer: ['a', 'b', 'd'],
      },
      {
        id: 'q4', type: 'single_choice',
        prompt: 'تفاوت == و === در چیست؟',
        options: [
          { id: 'a', label: 'هیچ تفاوتی ندارند' },
          { id: 'b', label: '== نوع‌ها را مقایسه می‌کند، === مقدار را' },
          { id: 'c', label: '=== پیش از مقایسه تبدیل نوع انجام نمی‌دهد' },
          { id: 'd', label: '== فقط برای اعداد است' },
        ],
        answer: 'c',
      },
      {
        id: 'q5', type: 'multi_choice',
        prompt: 'کدام‌ها روش‌های انتخاب عنصر در DOM هستند؟',
        options: [
          { id: 'a', label: 'document.querySelector' },
          { id: 'b', label: 'document.createElement' },
          { id: 'c', label: 'element.addEventListener' },
          { id: 'd', label: 'document.getElementById' },
        ],
        answer: ['a', 'd'],
      },
    ],
  },
];

/** Static route params for the export build (only demo exams exist there). */
export function demoCourseExamStaticParams(): { slug: string; examId: string }[] {
  return DEMO_EXAMS.map((e) => ({ slug: e.courseSlug, examId: e.id }));
}

function readExamStore(): { exams: DemoStoredExam[]; attempts: DemoStoredAttempt[] } {
  try {
    const raw = localStorage.getItem(EXAM_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { exams?: DemoStoredExam[]; attempts?: DemoStoredAttempt[] };
      if (Array.isArray(parsed.exams) && Array.isArray(parsed.attempts)) {
        return { exams: parsed.exams, attempts: parsed.attempts };
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return { exams: structuredClone(DEMO_EXAMS), attempts: [] };
}

function writeExamStore(store: { exams: DemoStoredExam[]; attempts: DemoStoredAttempt[] }): void {
  try {
    localStorage.setItem(EXAM_STORE_KEY, JSON.stringify(store));
  } catch {
    /* storage full or unavailable — demo keeps working in-memory */
  }
}

function updateDemoAttempt(attemptId: string, patch: Partial<DemoStoredAttempt>): void {
  const store = readExamStore();
  const attempt = store.attempts.find((a) => a.attemptId === attemptId);
  if (!attempt) return;
  Object.assign(attempt, patch);
  writeExamStore(store);
}

function findDemoExam(examId: string): DemoStoredExam {
  const exam = readExamStore().exams.find((e) => e.id === examId);
  if (!exam) throw new ApiError('Course exam not found', 404);
  return exam;
}

function demoExamSummaries(): CourseExamSummary[] {
  return readExamStore()
    .exams.slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((e) => ({
      id: e.id,
      courseId: e.courseId,
      courseSlug: e.courseSlug,
      courseTitle: e.courseTitle,
      title: e.title,
      description: e.description,
      passScore: e.passScore,
      durationMin: e.durationMin,
      published: true,
      sortOrder: e.sortOrder,
      questionCount: e.questions.length,
    }));
}

function toPublicDemoQuestion(q: CourseExamQuestion): Omit<CourseExamQuestion, 'answer'> {
  const { answer: _answer, ...rest } = q;
  return rest;
}

function demoExamSession(
  exam: DemoStoredExam,
  attempt: DemoStoredAttempt,
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED',
): CourseExamAttemptSession {
  const endsAt = new Date(Date.parse(attempt.startedAt) + exam.durationMin * 60_000);
  return {
    attemptId: attempt.attemptId,
    examId: exam.id,
    examTitle: exam.title,
    courseSlug: exam.courseSlug,
    durationMin: exam.durationMin,
    passScore: exam.passScore,
    startedAt: attempt.startedAt,
    endsAt: endsAt.toISOString(),
    questions: exam.questions.map(toPublicDemoQuestion),
    savedAnswers: attempt.answers,
    status,
  };
}

function isDemoAnswerCorrect(
  q: CourseExamQuestion,
  response: CourseExamResponse | undefined,
): boolean {
  if (!response || response.type !== q.type) return false;
  if (q.type === 'single_choice') {
    const answer = typeof q.answer === 'string' ? q.answer : q.answer[0];
    return response.type === 'single_choice' && response.optionId === answer;
  }
  const sort = (arr: string[]) => [...arr].sort();
  const expected = sort(Array.isArray(q.answer) ? q.answer : [q.answer]);
  const got = response.type === 'multi_choice' ? sort(response.optionIds) : [];
  return expected.length === got.length && expected.every((id, i) => id === got[i]);
}

function sanitizeDemoAnswers(input: Record<string, unknown>): Record<string, CourseExamResponse> {
  const out: Record<string, CourseExamResponse> = {};
  for (const [id, value] of Object.entries(input)) {
    if (!value || typeof value !== 'object') continue;
    const v = value as { type?: string };
    if (v.type === 'single_choice') {
      const optionId = (v as { optionId?: unknown }).optionId;
      if (typeof optionId === 'string') out[id] = { type: 'single_choice', optionId };
    } else if (v.type === 'multi_choice') {
      const ids = (v as { optionIds?: unknown }).optionIds;
      if (Array.isArray(ids) && ids.every((i) => typeof i === 'string')) {
        out[id] = { type: 'multi_choice', optionIds: ids as string[] };
      }
    }
  }
  return out;
}

function scoreDemoAttempt(
  exam: DemoStoredExam,
  answers: Record<string, CourseExamResponse>,
): Pick<CourseExamSubmitResult, 'score' | 'passed' | 'correctCount' | 'totalCount' | 'details'> {
  let points = 0;
  let total = 0;
  let correct = 0;
  const details = exam.questions.map((q) => {
    const isCorrect = isDemoAnswerCorrect(q, answers[q.id]);
    const qPoints = q.points ?? 1;
    total += qPoints;
    if (isCorrect) {
      correct += 1;
      points += qPoints;
    }
    return { questionId: q.id, correct: isCorrect, points: qPoints };
  });
  const score = total === 0 ? 0 : Math.round((points / total) * 100);
  return { score, passed: score >= exam.passScore, correctCount: correct, totalCount: exam.questions.length, details };
}

function demoSubmitResult(exam: DemoStoredExam, attempt: DemoStoredAttempt): CourseExamSubmitResult {
  const scored = scoreDemoAttempt(exam, attempt.answers);
  return {
    attemptId: attempt.attemptId,
    examId: exam.id,
    examTitle: exam.title,
    courseSlug: exam.courseSlug,
    score: attempt.score ?? scored.score,
    passed: attempt.passed ?? scored.passed,
    passScore: exam.passScore,
    correctCount: scored.correctCount,
    totalCount: scored.totalCount,
    details: scored.details,
    submittedAt: attempt.submittedAt ?? new Date().toISOString(),
  };
}

export const demoApi = {
  async register(dto: RegisterDto): Promise<AuthResponse> {
    return delay(
      authResponse({
        id: `demo-${Date.now()}`,
        name: dto.name,
        email: dto.email,
        phone: null,
        role: 'LEARNER',
        profileComplete: true,
        province: dto.province,
        city: dto.city,
      }),
    );
  },

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const adminEmail = (DEMO_ADMIN.email ?? '').toLowerCase();
    const learnerEmail = (DEMO_LEARNER.email ?? '').toLowerCase();
    if (email === adminEmail) {
      return delay(authResponse(DEMO_ADMIN));
    }
    if (email === learnerEmail || email.includes('@')) {
      return delay(
        authResponse({
          ...DEMO_LEARNER,
          email: dto.email,
          name: email === learnerEmail ? DEMO_LEARNER.name : dto.email.split('@')[0],
        }),
      );
    }
    throw new ApiError('Invalid credentials', 401);
  },

  async requestOtp(dto: { phone: string }): Promise<{ phone: string; expiresInSeconds: number; devCode?: string }> {
    const phone = dto.phone;
    return delay({ phone, expiresInSeconds: 300, devCode: '123456' });
  },

  async verifyOtp(dto: { phone: string; code: string }): Promise<AuthResponse> {
    if (dto.code !== '123456') throw new ApiError('Invalid verification code', 401);
    return delay(
      authResponse({
        id: `demo-phone-${dto.phone}`,
        name: '',
        email: null,
        phone: dto.phone,
        role: 'LEARNER',
        profileComplete: false,
      }),
    );
  },

  async completeProfile(dto: {
    firstName: string;
    lastName: string;
    province: string;
    city: string;
    email: string;
  }): Promise<AuthResponse> {
    const user = requireUser();
    const next: AuthUser = {
      ...user,
      name: `${dto.firstName} ${dto.lastName}`.trim(),
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      province: dto.province,
      city: dto.city,
      profileComplete: true,
    };
    return delay(authResponse(next));
  },

  async getProfile(): Promise<ProfileDetails> {
    const user = requireUser();
    return delay({
      firstName: user.firstName ?? user.name.split(' ')[0] ?? '',
      lastName: user.lastName ?? user.name.split(' ').slice(1).join(' '),
      province: user.province ?? 'تهران',
      city: user.city ?? 'تهران',
      email: user.email,
      phone: user.phone,
      name: user.name,
      bio: '',
      avatarUrl: null,
    });
  },

  async updateProfile(dto: UpdateProfileDto): Promise<AuthResponse> {
    return this.completeProfile(dto);
  },

  async uploadAvatar(_file: File): Promise<ProfileDetails> {
    return this.getProfile();
  },

  async logout(): Promise<void> {
    writeSession(null);
    await delay(undefined);
  },

  async refresh(): Promise<AuthTokens> {
    const user = readSession();
    if (!user) throw new ApiError('Unauthorized', 401);
    setAccessToken('demo-access-token');
    return delay({ accessToken: 'demo-access-token', expiresIn: 3600 });
  },

  async me(): Promise<LearnerState> {
    return delay(learnerStateFor(requireUser()));
  },

  async checkout(dto: CheckoutDto): Promise<PaymentResponse> {
    requireUser();
    const state = readState();
    const settings = readDemoSettings();
    let amountCents = 0;
    if (dto.productType === 'COURSE') amountCents = settings.pricing.courseCents;
    else if (dto.productType === 'ROADMAP_BUNDLE') {
      const answers = state.lastAnswers ?? defaultState().lastAnswers!;
      const roadmap = buildRoadmapFromAnswers(answers, false, 'local', {
        tracks: settings.tracks,
        pricing: settings.pricing,
      });
      amountCents = roadmap.pricing.discounted;
    }
    const productType = dto.productType ?? 'COURSE';
    const payment: PaymentResponse = {
      id: `pay-${Date.now()}`,
      productType,
      amountCents,
      currency: 'irr',
      status: 'COMPLETED',
    };
    state.payments = [payment, ...state.payments];
    if (productType === 'ROADMAP_BUNDLE') {
      state.roadmapEnrolled = true;
      state.hasRoadmap = true;
    }
    writeState(state);
    return delay(payment);
  },

  async confirmPayment(id: string): Promise<PaymentResponse> {
    requireUser();
    const state = readState();
    const found = state.payments.find((p) => p.id === id);
    if (!found) throw new ApiError('Payment not found', 404);
    found.status = 'COMPLETED';
    if (found.orderId) {
      const order = state.orders.find((o) => o.id === found.orderId);
      if (order) {
        order.status = 'PAID';
        order.paymentStatus = 'COMPLETED';
        order.updatedAt = new Date().toISOString();
        for (const item of order.items) {
          if (item.productType === 'COURSE' && !state.enrollments.includes(item.productRef)) {
            state.enrollments.push(item.productRef);
          }
        }
        state.cartCourseSlugs = [];
      }
    }
    if (found.productType === 'ROADMAP_BUNDLE') {
      state.roadmapEnrolled = true;
      state.hasRoadmap = true;
    }
    writeState(state);
    return delay({ ...found, status: 'COMPLETED' });
  },

  async getPayment(id: string): Promise<PaymentResponse> {
    requireUser();
    const mine = await this.myPayments();
    const found = mine.find((p) => p.id === id);
    if (!found) throw new ApiError('Payment not found', 404);
    return delay(found);
  },

  async myPayments(): Promise<PaymentResponse[]> {
    requireUser();
    return delay(readState().payments);
  },

  async getWallet(limit = 5): Promise<import('@kia-academy/shared').WalletSummary> {
    requireUser();
    const payments = readState().payments
      .filter((p) => p.status === 'COMPLETED' || p.status === 'REFUNDED')
      .slice(0, limit);
    return delay({
      balanceCents: 1_250_000,
      currency: 'irr',
      cardLast4: '1234',
      expiresLabel: '06/27',
      transactions: payments.map((payment) => ({
        id: payment.id,
        description:
          payment.productType === 'COURSE'
            ? `خرید دوره ${payment.productRef ?? ''}`
            : payment.productType,
        amountCents:
          payment.status === 'REFUNDED' ? payment.amountCents : -payment.amountCents,
        type: payment.status === 'REFUNDED' ? ('credit' as const) : ('debit' as const),
        createdAt: payment.createdAt ?? new Date().toISOString(),
        paymentId: payment.id,
      })),
    });
  },

  async listPaymentTransactions(limit = 5) {
    const wallet = await this.getWallet(limit);
    return wallet.transactions;
  },

  async checkoutCart(): Promise<PaymentResponse> {
    requireUser();
    const state = readState();
    const cart = buildDemoCart(state);
    if (cart.itemCount === 0) throw new ApiError('Cart is empty', 400);
    const payment: PaymentResponse = {
      id: `pay-${Date.now()}`,
      productType: 'COURSE',
      amountCents: cart.totalCents,
      currency: cart.currency,
      status: 'PENDING',
      orderId: `order-${Date.now()}`,
      invoiceNumber: `INV-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const order: OrderResponse = {
      id: payment.orderId!,
      status: 'AWAITING_PAYMENT',
      invoiceNumber: payment.invoiceNumber!,
      subtotalCents: cart.subtotalCents,
      discountCents: cart.discountCents,
      totalCents: cart.totalCents,
      currency: cart.currency,
      items: cart.items.map((item) => ({
        id: `oi-${item.id}`,
        productType: 'COURSE',
        productRef: item.courseSlug,
        title: item.title,
        thumbnail: item.thumbnail,
        instructor: item.instructor,
        unitPriceCents: item.priceCents,
        discountCents: item.discountCents,
        finalPriceCents: item.finalPriceCents,
        quantity: 1,
      })),
      paymentId: payment.id,
      paymentStatus: payment.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.payments = [payment, ...state.payments];
    state.orders = [order, ...state.orders];
    writeState(state);
    return delay(payment);
  },

  async retryPayment(orderId: string): Promise<PaymentResponse> {
    requireUser();
    const state = readState();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) throw new ApiError('Order not found', 404);
    const payment: PaymentResponse = {
      id: `pay-${Date.now()}`,
      productType: 'COURSE',
      amountCents: order.totalCents,
      currency: order.currency,
      status: 'PENDING',
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      createdAt: new Date().toISOString(),
    };
    order.paymentId = payment.id;
    order.paymentStatus = payment.status;
    order.status = 'AWAITING_PAYMENT';
    order.updatedAt = new Date().toISOString();
    state.payments = [payment, ...state.payments];
    writeState(state);
    return delay(payment);
  },

  async verifyPayment(dto: GatewayVerifyDto): Promise<GatewayVerifyResponse> {
    requireUser();
    const state = readState();
    const payment =
      state.payments.find((p) => p.id === dto.paymentId) ?? state.payments[0];
    if (!payment) throw new ApiError('Payment not found', 404);
    payment.status = 'COMPLETED';
    if (payment.orderId) {
      const order = state.orders.find((o) => o.id === payment.orderId);
      if (order) {
        order.status = 'PAID';
        order.paymentStatus = 'COMPLETED';
        order.updatedAt = new Date().toISOString();
        for (const item of order.items) {
          if (item.productType === 'COURSE' && !state.enrollments.includes(item.productRef)) {
            state.enrollments.push(item.productRef);
          }
        }
        state.cartCourseSlugs = [];
      }
    }
    writeState(state);
    return delay({
      success: true,
      payment,
      redirectUrl: `/checkout/success?payment_id=${encodeURIComponent(payment.id)}`,
    });
  },

  async myOrders(): Promise<OrderResponse[]> {
    requireUser();
    return delay(readState().orders);
  },

  async getOrder(orderId: string): Promise<OrderResponse> {
    requireUser();
    const order = readState().orders.find((o) => o.id === orderId);
    if (!order) throw new ApiError('Order not found', 404);
    return delay(order);
  },

  async getInvoice(orderId: string): Promise<InvoiceResponse> {
    requireUser();
    const user = requireUser();
    const order = readState().orders.find((o) => o.id === orderId);
    if (!order) throw new ApiError('Order not found', 404);
    if (order.status !== 'PAID') throw new ApiError('Invoice unavailable', 404);
    return delay({
      id: `inv-${order.id}`,
      orderId: order.id,
      invoiceNumber: order.invoiceNumber || order.id,
      issuedAt: order.updatedAt,
      buyerName: user.name,
      buyerEmail: user.email,
      buyerPhone: user.phone,
      currency: order.currency,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      totalCents: order.totalCents,
      lineItems: order.items,
      downloadPath: `/api/payments/orders/${order.id}/invoice.html`,
    });
  },

  async getCart(): Promise<CartResponse> {
    requireUser();
    return delay(buildDemoCart(readState()));
  },

  async addToCart(courseSlug: string): Promise<CartResponse> {
    requireUser();
    const state = readState();
    const course = courses.find((c) => c.slug === courseSlug || c.id === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    if (state.enrollments.includes(course.slug)) {
      throw new ApiError('Course is already purchased', 409);
    }
    if (state.cartCourseSlugs.includes(course.slug)) {
      throw new ApiError('Course is already in the cart', 409);
    }
    state.cartCourseSlugs = [...state.cartCourseSlugs, course.slug];
    writeState(state);
    return delay(buildDemoCart(state));
  },

  async removeCartItem(itemId: string): Promise<CartResponse> {
    requireUser();
    const state = readState();
    const cart = buildDemoCart(state);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new ApiError('Cart item not found', 404);
    state.cartCourseSlugs = state.cartCourseSlugs.filter((s) => s !== item.courseSlug);
    writeState(state);
    return delay(buildDemoCart(state));
  },

  async clearCart(): Promise<CartResponse> {
    requireUser();
    const state = readState();
    state.cartCourseSlugs = [];
    writeState(state);
    return delay(buildDemoCart(state));
  },

  async listCourses(): Promise<CourseSummary[]> {
    return delay(courses.filter((c) => c.published).map(toCourseSummary));
  },

  async listMyCourseExams(): Promise<CourseExamSummary[]> {
    requireUser();
    return demoExamSummaries();
  },

  async listCourseExamsForLearner(courseSlug: string): Promise<CourseExamSummary[]> {
    requireUser();
    return demoExamSummaries().filter((e) => e.courseSlug === courseSlug);
  },

  async listCourseExamAttempts(examId: string): Promise<CourseExamAttemptSummary[]> {
    requireUser();
    const store = readExamStore();
    return store.attempts
      .filter((a) => a.examId === examId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .map((a) => ({
        id: a.attemptId,
        examId: a.examId,
        status: a.status,
        score: a.status === 'SUBMITTED' ? a.score : null,
        passed: a.status === 'SUBMITTED' ? a.passed : null,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
      }));
  },

  async startCourseExam(examId: string): Promise<CourseExamAttemptSession> {
    requireUser();
    const exam = findDemoExam(examId);
    const store = readExamStore();
    const existing = store.attempts
      .filter((a) => a.examId === examId && a.status !== 'SUBMITTED')
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
    if (existing) {
      const endsAt = Date.parse(existing.startedAt) + exam.durationMin * 60_000;
      let status = existing.status;
      if (status === 'IN_PROGRESS' && Date.now() > endsAt) status = 'EXPIRED';
      if (status !== existing.status) {
        updateDemoAttempt(existing.attemptId, { status });
        existing.status = status;
      }
      return demoExamSession(exam, existing, status);
    }
    const attempt: DemoStoredAttempt = {
      attemptId: `demo-attempt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      examId,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      submittedAt: null,
      score: null,
      passed: null,
      answers: {},
    };
    store.attempts.push(attempt);
    writeExamStore(store);
    return demoExamSession(exam, attempt, 'IN_PROGRESS');
  },

  async saveCourseExamAnswers(
    examId: string,
    attemptId: string,
    answers: Record<string, unknown>,
  ): Promise<{ ok: true }> {
    requireUser();
    findDemoExam(examId);
    const store = readExamStore();
    const attempt = store.attempts.find((a) => a.attemptId === attemptId);
    if (!attempt || attempt.examId !== examId) {
      throw new ApiError('Course exam attempt not found', 404);
    }
    if (attempt.status === 'SUBMITTED') {
      throw new ApiError('Attempt already submitted', 400);
    }
    if (attempt.status === 'EXPIRED') {
      throw new ApiError('Attempt expired', 400);
    }
    const endsAt = Date.parse(attempt.startedAt) + findDemoExam(examId).durationMin * 60_000;
    if (Date.now() > endsAt) {
      updateDemoAttempt(attemptId, { status: 'EXPIRED' });
      throw new ApiError('Attempt expired', 400);
    }
    attempt.answers = { ...attempt.answers, ...sanitizeDemoAnswers(answers) };
    writeExamStore(store);
    return { ok: true };
  },

  async submitCourseExam(
    examId: string,
    attemptId: string,
    answers: Record<string, unknown>,
  ): Promise<CourseExamSubmitResult> {
    requireUser();
    const exam = findDemoExam(examId);
    const store = readExamStore();
    const attempt = store.attempts.find((a) => a.attemptId === attemptId);
    if (!attempt || attempt.examId !== examId) {
      throw new ApiError('Course exam attempt not found', 404);
    }
    if (attempt.status === 'SUBMITTED' && attempt.score !== null) {
      return demoSubmitResult(exam, attempt);
    }
    const merged = { ...attempt.answers, ...sanitizeDemoAnswers(answers) };
    const scored = scoreDemoAttempt(exam, merged);
    Object.assign(attempt, {
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      score: scored.score,
      passed: scored.passed,
      answers: merged,
    });
    writeExamStore(store);
    return demoSubmitResult(exam, attempt);
  },

  async getCourseExamAttemptResult(
    examId: string,
    attemptId: string,
  ): Promise<CourseExamSubmitResult> {
    requireUser();
    const exam = findDemoExam(examId);
    const store = readExamStore();
    const attempt = store.attempts.find((a) => a.attemptId === attemptId);
    if (!attempt || attempt.examId !== examId) {
      throw new ApiError('Course exam attempt not found', 404);
    }
    if (attempt.status !== 'SUBMITTED' || attempt.score === null) {
      throw new ApiError('Attempt has not been submitted', 400);
    }
    return demoSubmitResult(exam, attempt);
  },

  async listMyCourses(): Promise<CourseSummary[]> {
    requireUser();
    return delay(courses.filter((course) => course.published && toCourseSummary(course).enrolled).map(toCourseSummary));
  },

  async getCourse(slug: string): Promise<CourseSummary & { lessons: LessonSummary[] }> {
    const course = courses.find((c) => c.slug === slug);
    if (!course) throw new ApiError('Course not found', 404);
    const state = readState();
    const lessons: LessonSummary[] = course.lessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      durationMin: l.durationMin,
      completed: state.completedLessons.includes(lessonKey(slug, l.slug)),
      hasVideo: Boolean(l.videoUrl),
    }));
    return delay({ ...toCourseSummary(course), lessons });
  },

  async getLesson(courseSlug: string, lessonSlug: string): Promise<LessonDetail> {
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    const index = course.lessons.findIndex((l) => l.slug === lessonSlug);
    if (index < 0) throw new ApiError('Lesson not found', 404);
    const lesson = course.lessons[index];
    const state = readState();
    return delay({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      durationMin: lesson.durationMin,
      completed: state.completedLessons.includes(lessonKey(courseSlug, lessonSlug)),
      hasVideo: Boolean(lesson.videoUrl),
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      courseSlug,
      courseTitle: course.title,
      prevSlug: index > 0 ? course.lessons[index - 1].slug : null,
      nextSlug: index < course.lessons.length - 1 ? course.lessons[index + 1].slug : null,
    });
  },

  async enrollCourse(slug: string): Promise<void> {
    requireUser();
    const course = courses.find((c) => c.slug === slug);
    if (!course) throw new ApiError('Course not found', 404);
    const state = readState();
    if (!state.enrollments.includes(slug)) {
      state.enrollments = [...state.enrollments, slug];
      writeState(state);
    }
    await delay(undefined);
  },

  async completeLesson(courseSlug: string, lessonSlug: string): Promise<void> {
    requireUser();
    const key = lessonKey(courseSlug, lessonSlug);
    const state = readState();
    if (!state.completedLessons.includes(key)) {
      state.completedLessons = [...state.completedLessons, key];
      writeState(state);
    }
    await delay(undefined);
  },

  async submitPersonality(answers: MiniIpipAnswers): Promise<PersonalityResult> {
    requireUser();
    const bank = readDemoTestBank('personality').bank as PersonalityBank;
    const scored = scoreMiniIpip(answers, {
      id: `personality-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: bank.items,
    });
    const state = readState();
    state.personalityResult = { ...scored, citation: bank.citation };
    writeState(state);
    return delay(state.personalityResult);
  },

  async latestPersonality(): Promise<PersonalityResult | null> {
    requireUser();
    return delay(readState().personalityResult);
  },

  async latestAssessment(): Promise<AssessmentResponse | null> {
    requireUser();
    const state = readState();
    if (!state.lastAnswers) return delay(null);
    return delay({
      id: `assessment-${state.roadmapId ?? 'demo'}`,
      answers: state.lastAnswers,
      createdAt: new Date().toISOString(),
    });
  },

  async getTestReport(examAttemptId?: string): Promise<LearnerTestReport> {
    requireUser();
    const state = readState();
    const personality = state.personalityResult;
    const assessment = state.lastAnswers
      ? {
          id: `assessment-${state.roadmapId ?? 'demo'}`,
          answers: state.lastAnswers,
          createdAt: new Date().toISOString(),
        }
      : null;

    let readiness: LearnerTestReport['readiness'] = null;
    if (state.examAttempt?.result) {
      const result = state.examAttempt.result;
      readiness = {
        id: examAttemptId ?? result.attemptId,
        createdAt: result.submittedAt,
        percentages: result.percentages,
        average: result.average,
        passed: result.passed,
        verdict: result.verdict,
        outcome: result.outcome,
      };
    } else if (state.testCompleted) {
      readiness = null;
    }

    const settings = readDemoSettings();
    const answers = state.lastAnswers ?? defaultState().lastAnswers;
    const built = answers
      ? buildRoadmapFromAnswers(answers, state.roadmapEnrolled, state.roadmapId ?? 'demo', {
          tracks: settings.tracks,
          pricing: settings.pricing,
        })
      : null;

    return delay({
      personality,
      assessment,
      readiness,
      roadmap: built
        ? {
            id: built.id,
            trackKey: built.trackKey,
            trackName: built.trackName,
            level: built.level,
            profile: built.profile,
          }
        : null,
    });
  },

  async saveRoadmap(answers: AssessmentAnswers): Promise<RoadmapResponse> {
    requireUser();
    const state = readState();
    state.lastAnswers = answers;
    state.hasRoadmap = true;
    state.roadmapId = `roadmap-${Date.now()}`;
    writeState(state);
    const settings = readDemoSettings();
    return delay(
      buildRoadmapFromAnswers(answers, state.roadmapEnrolled, state.roadmapId, {
        tracks: settings.tracks,
        pricing: settings.pricing,
      }),
    );
  },

  async getRoadmap(id: string): Promise<RoadmapResponse> {
    requireUser();
    const state = readState();
    const answers = state.lastAnswers ?? defaultState().lastAnswers!;
    const settings = readDemoSettings();
    return delay(
      buildRoadmapFromAnswers(answers, state.roadmapEnrolled, id, {
        tracks: settings.tracks,
        pricing: settings.pricing,
      }),
    );
  },

  async enrollRoadmap(roadmapId: string): Promise<RoadmapResponse> {
    requireUser();
    const state = readState();
    state.roadmapEnrolled = true;
    state.hasRoadmap = true;
    state.roadmapId = roadmapId;
    writeState(state);
    const answers = state.lastAnswers ?? defaultState().lastAnswers!;
    const settings = readDemoSettings();
    return delay(
      buildRoadmapFromAnswers(answers, true, roadmapId, {
        tracks: settings.tracks,
        pricing: settings.pricing,
      }),
    );
  },

  async startExam(roadmapId?: string): Promise<ExamAttemptSession> {
    requireUser();
    const state = readState();
    const now = Date.now();
    const bankQuestions = (readDemoTestBank('readiness').bank as ReadinessBank).questions;
    if (
      state.examAttempt &&
      state.examAttempt.status === 'IN_PROGRESS' &&
      new Date(state.examAttempt.endsAt).getTime() > now
    ) {
      return delay({
        attemptId: state.examAttempt.attemptId,
        blueprintVersion: EXAM_BLUEPRINT_VERSION,
        durationSec: EXAM_DURATION_SEC,
        startedAt: state.examAttempt.startedAt,
        endsAt: state.examAttempt.endsAt,
        roadmapId: roadmapId ?? state.roadmapId,
        questions: toPublicExamQuestions(bankQuestions),
        savedAnswers: state.examAttempt.answers,
        status: 'IN_PROGRESS',
      });
    }

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + EXAM_DURATION_SEC * 1000);
    const attemptId = `demo-exam-${startedAt.getTime()}`;
    state.examAttempt = {
      attemptId,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      answers: {},
      status: 'IN_PROGRESS',
    };
    writeState(state);

    return delay({
      attemptId,
      blueprintVersion: EXAM_BLUEPRINT_VERSION,
      durationSec: EXAM_DURATION_SEC,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      roadmapId: roadmapId ?? state.roadmapId,
      questions: toPublicExamQuestions(bankQuestions),
      savedAnswers: {},
      status: 'IN_PROGRESS',
    });
  },

  async saveExamAnswers(
    attemptId: string,
    answers: Record<string, ExamResponse>,
  ): Promise<{ ok: true; remainingSec: number }> {
    requireUser();
    const state = readState();
    if (!state.examAttempt || state.examAttempt.attemptId !== attemptId) {
      throw new ApiError('Exam attempt not found', 404);
    }
    state.examAttempt.answers = { ...state.examAttempt.answers, ...answers };
    writeState(state);
    const remainingSec = Math.max(
      0,
      Math.floor((new Date(state.examAttempt.endsAt).getTime() - Date.now()) / 1000),
    );
    return delay({ ok: true, remainingSec });
  },

  async submitExam(
    attemptId: string,
    answers?: Record<string, ExamResponse>,
  ): Promise<ExamSubmitResult> {
    requireUser();
    const state = readState();
    if (!state.examAttempt || state.examAttempt.attemptId !== attemptId) {
      throw new ApiError('Exam attempt not found', 404);
    }
    if (state.examAttempt.result) {
      return delay(state.examAttempt.result);
    }

    const merged = { ...state.examAttempt.answers, ...(answers ?? {}) };
    const bankQuestions = (readDemoTestBank('readiness').bank as ReadinessBank).questions;
    const graded = gradeAttempt(bankQuestions, merged);
    const modules =
      state.roadmapModules ??
      buildRoadmapFromAnswers(
        state.lastAnswers ?? defaultState().lastAnswers!,
        true,
        state.roadmapId ?? 'demo-roadmap',
      ).modules;
    const level = state.roadmapLevel ?? 'absoluteBeginner';
    const outcome = buildExamOutcome({
      passed: graded.passed,
      average: graded.average,
      percentages: graded.percentages,
      roadmap: {
        id: state.roadmapId ?? 'demo-roadmap',
        modules,
        level,
      },
    });
    state.roadmapModules = outcome.roadmapModules;
    state.roadmapLevel = outcome.levelAfter || level;
    const verdict = buildExamVerdict({
      passed: graded.passed,
      average: graded.average,
      outcome,
    });
    const result: ExamSubmitResult = {
      attemptId,
      average: graded.average,
      passed: graded.passed,
      domainScores: graded.domainScores,
      percentages: graded.percentages,
      outcome,
      verdict,
      submittedAt: new Date().toISOString(),
    };
    state.examAttempt = {
      ...state.examAttempt,
      answers: merged,
      status: 'SUBMITTED',
      result,
    };
    state.testCompleted = true;
    writeState(state);
    return delay(result);
  },

  async getExamAttempt(
    attemptId: string,
  ): Promise<ExamAttemptSession | ExamSubmitResult> {
    requireUser();
    const state = readState();
    if (!state.examAttempt || state.examAttempt.attemptId !== attemptId) {
      throw new ApiError('Exam attempt not found', 404);
    }
    if (state.examAttempt.result) return delay(state.examAttempt.result);
    return delay({
      attemptId,
      blueprintVersion: EXAM_BLUEPRINT_VERSION,
      durationSec: EXAM_DURATION_SEC,
      startedAt: state.examAttempt.startedAt,
      endsAt: state.examAttempt.endsAt,
      roadmapId: state.roadmapId,
      questions: toPublicExamQuestions(
        (readDemoTestBank('readiness').bank as ReadinessBank).questions,
      ),
      savedAnswers: state.examAttempt.answers,
      status: state.examAttempt.status,
    });
  },

  async saveReadinessTest(scores: ReadinessScores): Promise<ReadinessResult> {
    requireUser();
    const state = readState();
    // Preparations (readiness) test is free after the first assessment.
    const settings = readDemoSettings();
    const result = computeReadinessResult(scores, settings.readiness);
    state.testCompleted = true;
    writeState(state);
    return delay(result);
  },

  async listReadinessTests(): Promise<ReadinessTestSummary[]> {
    requireUser();
    const state = readState();
    if (!state.examAttempt?.result) return delay([]);
    const result = state.examAttempt.result;
    return delay([
      {
        id: state.examAttempt.attemptId,
        createdAt: result.submittedAt,
        average: result.average,
        passed: result.passed,
      },
    ]);
  },

  async getReadinessTest(id: string): Promise<
    ReadinessResult & { id: string; createdAt: string; outcome?: ExamSubmitResult['outcome'] }
  > {
    requireUser();
    const state = readState();
    if (!state.testCompleted) throw new ApiError('Test not found', 404);
    if (state.examAttempt?.result) {
      const result = state.examAttempt.result;
      return delay({
        id,
        createdAt: result.submittedAt,
        percentages: result.percentages,
        average: result.average,
        passed: result.passed,
        verdict: {
          icon: result.verdict.icon,
          title: result.verdict.title.en,
          message: result.verdict.message.en,
          unlockTitle: result.verdict.unlockTitle.en,
          unlockSub: result.verdict.unlockSub.en,
          variant: result.verdict.variant,
        },
        outcome: result.outcome,
      });
    }
    const settings = readDemoSettings();
    const result = computeReadinessResult({}, settings.readiness);
    return delay({
      id,
      createdAt: new Date().toISOString(),
      ...result,
    });
  },

  async submitContactForm(_dto: ContactFormDto): Promise<ContactFormResponse> {
    return delay({ ok: true, message: 'Message received' });
  },

  async submitChallenge(code: string): Promise<ChallengeScoreResult> {
    requireUser();
    const settings = readDemoSettings();
    return delay(buildChallengeResult(code, settings.bootcamp));
  },

  async getBootcampState(): Promise<BootcampState> {
    requireUser();
    const settings = readDemoSettings();
    const now = Date.now();
    return delay({
      rank: settings.bootcamp.defaultRank,
      points: settings.bootcamp.defaultPoints,
      leaderboard: [
        { rank: 1, name: 'Priya M.', score: 890 },
        { rank: 12, name: 'You', score: settings.bootcamp.defaultPoints, isMe: true },
      ],
      cardTimerSeconds: 2 * 3600,
      challenges: [
        {
          id: 'demo-challenge-1',
          slug: 'fizzbuzz',
          title: 'FizzBuzz Challenge',
          startsAt: new Date(now - 86_400_000).toISOString(),
          endsAt: new Date(now + 7 * 86_400_000).toISOString(),
          status: 'active',
          points: 120,
        },
      ],
    });
  },

  async listTickets(): Promise<SupportTicketSummary[]> {
    requireUser();
    return delay([]);
  },

  async getTicket(id: string): Promise<SupportTicketDetail> {
    requireUser();
    throw new ApiError(`Ticket ${id} not found`, 404);
  },

  async createTicket(dto: CreateTicketDto, _files: File[] = []): Promise<SupportTicketDetail> {
    requireUser();
    const now = new Date().toISOString();
    return delay({
      id: `demo-ticket-${Date.now()}`,
      subject: dto.subject,
      body: dto.body,
      status: 'OPEN',
      priority: dto.priority ?? 'NORMAL',
      category: dto.category ?? null,
      courseId: null,
      courseSlug: dto.courseSlug ?? null,
      courseTitle: null,
      createdAt: now,
      updatedAt: now,
      replyCount: 0,
      attachments: [],
      replies: [],
    });
  },

  async replyTicket(id: string, dto: TicketReplyDto, _files: File[] = []): Promise<SupportTicketDetail> {
    requireUser();
    const now = new Date().toISOString();
    return delay({
      id,
      subject: 'Demo ticket',
      body: 'Demo body',
      status: 'OPEN',
      priority: 'NORMAL',
      category: null,
      courseId: null,
      courseSlug: null,
      courseTitle: null,
      createdAt: now,
      updatedAt: now,
      replyCount: 1,
      attachments: [],
      replies: [
        {
          id: `demo-reply-${Date.now()}`,
          body: dto.body,
          isStaff: false,
          authorName: requireUser().name,
          createdAt: now,
          attachments: [],
        },
      ],
    });
  },

  async listMessages(): Promise<LearnerMessageDto[]> {
    requireUser();
    return delay([
      {
        id: 'demo-msg-1',
        subject: 'Welcome to your learner panel',
        body: 'Your dashboard includes finance, tickets, progress, and events.',
        readAt: null,
        createdAt: DEMO_CREATED_AT,
      },
    ]);
  },

  async markMessageRead(id: string): Promise<LearnerMessageDto> {
    requireUser();
    return delay({
      id,
      subject: 'Welcome to your learner panel',
      body: 'Your dashboard includes finance, tickets, progress, and events.',
      readAt: new Date().toISOString(),
      createdAt: DEMO_CREATED_AT,
    });
  },

  async listTodos(): Promise<LearnerTodoDto[]> {
    requireUser();
    return delay(demoTodos);
  },

  async createTodo(dto: CreateTodoDto): Promise<LearnerTodoDto> {
    requireUser();
    const now = new Date().toISOString();
    const todo: LearnerTodoDto = {
      id: `demo-todo-${Date.now()}`,
      title: dto.title,
      done: false,
      sortOrder: demoTodos.length,
      createdAt: now,
      updatedAt: now,
    };
    demoTodos = [...demoTodos, todo];
    return delay(todo);
  },

  async updateTodo(id: string, dto: UpdateTodoDto): Promise<LearnerTodoDto> {
    requireUser();
    demoTodos = demoTodos.map((todo) =>
      todo.id === id
        ? {
            ...todo,
            ...dto,
            updatedAt: new Date().toISOString(),
          }
        : todo,
    );
    const found = demoTodos.find((todo) => todo.id === id);
    if (!found) throw new ApiError('Todo not found', 404);
    return delay(found);
  },

  async deleteTodo(id: string): Promise<void> {
    requireUser();
    demoTodos = demoTodos.filter((todo) => todo.id !== id);
    await delay(undefined);
  },

  async listCompetitions(): Promise<CompetitionSummary[]> {
    requireUser();
    return delay(demoCompetitions);
  },

  async listMyCompetitions(): Promise<CompetitionSummary[]> {
    requireUser();
    return delay(demoCompetitions.filter((item) => item.registered));
  },

  async registerCompetition(slug: string): Promise<CompetitionSummary> {
    requireUser();
    demoCompetitions = demoCompetitions.map((item) =>
      item.slug === slug ? { ...item, registered: true } : item,
    );
    const found = demoCompetitions.find((item) => item.slug === slug);
    if (!found) throw new ApiError('Competition not found', 404);
    return delay(found);
  },

  async listCourseAttachments(slug: string): Promise<CourseAttachmentDto[]> {
    requireUser();
    if (slug !== 'javascript') return delay([]);
    return delay([
      {
        id: 'demo-att-1',
        title: 'JavaScript cheatsheet',
        fileName: 'js-cheatsheet.pdf',
        fileUrl: '#',
        mimeType: 'application/pdf',
        sizeBytes: 245000,
        sortOrder: 0,
        createdAt: DEMO_CREATED_AT,
      },
    ]);
  },

  async getProgress(): Promise<LearnerProgressSummary> {
    requireUser();
    const mine = await this.listMyCourses();
    const courseAvg =
      mine.length > 0
        ? Math.round(mine.reduce((sum, c) => sum + c.progressPct, 0) / mine.length)
        : 0;
    return delay({
      courses: mine.map((course) => ({
        slug: course.slug,
        title: course.title,
        progressPct: course.progressPct,
      })),
      examAverage: null,
      bootcampPoints: 340,
      points: [
        ...mine.map((course) => ({
          label: course.title,
          value: course.progressPct,
          kind: 'course' as const,
        })),
        { label: 'Bootcamp', value: 34, kind: 'bootcamp' as const },
      ],
      overallPct: courseAvg,
      courseCount: mine.length,
      examCount: 0,
      certificateCount: mine.filter((c) => c.progressPct >= 100).length,
      activity: [],
    });
  },

  async adminStats(): Promise<AdminStats> {
    requireUser();
    const state = readState();
    return delay({
      users: 2,
      courses: courses.length,
      lessons: courses.reduce((n, c) => n + c.lessons.length, 0),
      enrollments: state.enrollments.length,
      payments: state.payments.length,
      revenueCents: state.payments.reduce((n, p) => n + p.amountCents, 0),
      challenges: challenges.length,
      activeChallenges: challenges.filter((c) => c.active).length,
    });
  },

  async adminListCourses(): Promise<AdminCourse[]> {
    requireUser();
    return delay(
      courses.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        icon: c.icon,
        trackKey: c.trackKey,
        sortOrder: c.sortOrder,
        published: c.published,
        lessonCount: c.lessons.length,
        lessons: c.lessons.map(
          (l): AdminLesson => ({
            id: l.id,
            slug: l.slug,
            title: l.title,
            content: l.content,
            videoUrl: l.videoUrl,
            durationMin: l.durationMin,
            sortOrder: l.sortOrder,
          }),
        ),
      })),
    );
  },

  async adminCreateCourse(dto: CreateCourseDto): Promise<AdminCourse> {
    requireUser();
    const course: DemoCourse = {
      id: `course-${Date.now()}`,
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      icon: dto.icon ?? '📘',
      trackKey: dto.trackKey ?? null,
      sortOrder: dto.sortOrder ?? courses.length + 1,
      published: dto.published ?? true,
      lessons: (dto.lessons ?? []).map((l, i) => ({
        id: `lesson-${Date.now()}-${i}`,
        slug: l.slug,
        title: l.title,
        content: l.content,
        durationMin: l.durationMin ?? 10,
        sortOrder: l.sortOrder ?? i + 1,
        videoUrl: null,
      })),
    };
    courses = [...courses, course];
    return delay({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      icon: course.icon,
      trackKey: course.trackKey,
      sortOrder: course.sortOrder,
      published: course.published,
      lessonCount: course.lessons.length,
      lessons: course.lessons,
    });
  },

  async adminUpdateCourse(slug: string, dto: UpdateCourseDto): Promise<AdminCourse> {
    requireUser();
    const index = courses.findIndex((c) => c.slug === slug);
    if (index < 0) throw new ApiError('Course not found', 404);
    const current = courses[index];
    const updated: DemoCourse = {
      ...current,
      ...dto,
      trackKey: dto.trackKey === undefined ? current.trackKey : dto.trackKey,
      lessons: current.lessons,
    };
    courses = courses.map((c, i) => (i === index ? updated : c));
    return delay({
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      description: updated.description,
      icon: updated.icon,
      trackKey: updated.trackKey,
      sortOrder: updated.sortOrder,
      published: updated.published,
      lessonCount: updated.lessons.length,
      lessons: updated.lessons,
    });
  },

  async adminDeleteCourse(slug: string): Promise<void> {
    requireUser();
    courses = courses.filter((c) => c.slug !== slug);
    await delay(undefined);
  },

  async adminCreateLesson(courseSlug: string, dto: CreateLessonDto): Promise<AdminLesson> {
    requireUser();
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    const lesson: DemoLesson = {
      id: `lesson-${Date.now()}`,
      slug: dto.slug,
      title: dto.title,
      content: dto.content,
      durationMin: dto.durationMin ?? 10,
      sortOrder: dto.sortOrder ?? course.lessons.length + 1,
      videoUrl: null,
    };
    course.lessons = [...course.lessons, lesson];
    return delay(lesson);
  },

  async adminUpdateLesson(
    courseSlug: string,
    lessonSlug: string,
    dto: UpdateLessonDto,
  ): Promise<AdminLesson> {
    requireUser();
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    const index = course.lessons.findIndex((l) => l.slug === lessonSlug);
    if (index < 0) throw new ApiError('Lesson not found', 404);
    const current = course.lessons[index];
    if (dto.slug && dto.slug !== lessonSlug && course.lessons.some((l) => l.slug === dto.slug)) {
      throw new ApiError('Lesson slug already exists', 409);
    }
    const updated: DemoLesson = { ...current, ...dto };
    course.lessons = course.lessons.map((l, i) => (i === index ? updated : l));
    return delay(updated);
  },

  async adminDeleteLesson(courseSlug: string, lessonSlug: string): Promise<void> {
    requireUser();
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    course.lessons = course.lessons.filter((l) => l.slug !== lessonSlug);
    await delay(undefined);
  },

  async adminUploadLessonVideo(
    courseSlug: string,
    lessonSlug: string,
    file: File,
  ): Promise<AdminLesson> {
    requireUser();
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    const index = course.lessons.findIndex((l) => l.slug === lessonSlug);
    if (index < 0) throw new ApiError('Lesson not found', 404);
    const videoUrl = await fileToDataUrl(file);
    const updated = { ...course.lessons[index], videoUrl };
    course.lessons = course.lessons.map((l, i) => (i === index ? updated : l));
    return delay(updated);
  },

  async adminDeleteLessonVideo(courseSlug: string, lessonSlug: string): Promise<AdminLesson> {
    requireUser();
    const course = courses.find((c) => c.slug === courseSlug);
    if (!course) throw new ApiError('Course not found', 404);
    const index = course.lessons.findIndex((l) => l.slug === lessonSlug);
    if (index < 0) throw new ApiError('Lesson not found', 404);
    const updated = { ...course.lessons[index], videoUrl: null };
    course.lessons = course.lessons.map((l, i) => (i === index ? updated : l));
    return delay(updated);
  },

  async adminListChallenges(): Promise<AdminChallenge[]> {
    requireUser();
    return delay(challenges);
  },

  async adminCreateChallenge(dto: CreateChallengeDto): Promise<AdminChallenge> {
    requireUser();
    const challenge: AdminChallenge = {
      id: `challenge-${Date.now()}`,
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      points: dto.points ?? 50,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      active: dto.active ?? true,
      starterCode: dto.starterCode ?? '',
    };
    challenges = [...challenges, challenge];
    return delay(challenge);
  },

  async adminUpdateChallenge(slug: string, dto: UpdateChallengeDto): Promise<AdminChallenge> {
    requireUser();
    const index = challenges.findIndex((c) => c.slug === slug);
    if (index < 0) throw new ApiError('Challenge not found', 404);
    const updated = { ...challenges[index], ...dto };
    challenges = challenges.map((c, i) => (i === index ? updated : c));
    return delay(updated);
  },

  async adminDeleteChallenge(slug: string): Promise<void> {
    requireUser();
    challenges = challenges.filter((c) => c.slug !== slug);
    await delay(undefined);
  },

  async adminListUsers(): Promise<AdminUser[]> {
    requireUser();
    return delay(demoAdminUsers.map((u) => ({ ...u })));
  },

  async adminCreateUser(dto: AdminCreateUserDto): Promise<AdminUser> {
    requireUser();
    const email = dto.email.trim().toLowerCase();
    if (!email.includes('@')) throw new ApiError('Invalid email', 400);
    if (!dto.password || dto.password.length < 8) {
      throw new ApiError('Password must be at least 8 characters', 400);
    }
    if (demoAdminUsers.some((u) => (u.email ?? '').toLowerCase() === email)) {
      throw new ApiError('Email already registered', 409);
    }
    const phone = dto.phone?.trim() || null;
    if (phone && demoAdminUsers.some((u) => u.phone === phone)) {
      throw new ApiError('Phone already registered', 409);
    }
    const role = dto.role ?? 'LEARNER';
    const created: AdminUser = {
      id: `demo-user-${Date.now()}`,
      name: dto.name.trim(),
      email,
      phone,
      role,
      createdAt: new Date().toISOString(),
      adminPanelAccess:
        role === 'ADMIN'
          ? normalizeAdminAccess(readDemoSettings().adminAccess)
          : null,
    };
    demoAdminUsers = [created, ...demoAdminUsers];
    return delay({ ...created });
  },

  async adminListPayments(): Promise<AdminPayment[]> {
    requireUser();
    const state = readState();
    if (state.payments.length === 0) {
      state.payments = [
        {
          id: 'demo-pay-1',
          productType: 'ROADMAP_BUNDLE',
          amountCents: 2_490_000,
          currency: 'irr',
          status: 'COMPLETED',
        },
      ];
      writeState(state);
    }
    const user = DEMO_LEARNER;
    return delay(
      state.payments.map((p) => ({
        id: p.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        productType: p.productType,
        productRef: null,
        amountCents: p.amountCents,
        currency: p.currency,
        status: p.status,
        createdAt: DEMO_CREATED_AT,
      })),
    );
  },

  async adminUpdateUserRole(userId: string, role: UserRole): Promise<AdminUser> {
    requireUser();
    const index = demoAdminUsers.findIndex((u) => u.id === userId);
    if (index < 0) throw new ApiError('User not found', 404);
    const updated: AdminUser = {
      ...demoAdminUsers[index],
      role,
      adminPanelAccess:
        role === 'ADMIN'
          ? demoAdminUsers[index].adminPanelAccess ??
            normalizeAdminAccess(readDemoSettings().adminAccess)
          : null,
    };
    demoAdminUsers = demoAdminUsers.map((u, i) => (i === index ? updated : u));
    return delay({ ...updated });
  },

  async adminUpdateUserAccess(
    userId: string,
    adminPanelAccess: SiteAdminAccessSettings,
  ): Promise<AdminUser> {
    requireUser();
    const index = demoAdminUsers.findIndex((u) => u.id === userId);
    if (index < 0) throw new ApiError('User not found', 404);
    const updated: AdminUser = {
      ...demoAdminUsers[index],
      role: 'ADMIN',
      adminPanelAccess: normalizeAdminAccess(adminPanelAccess),
    };
    demoAdminUsers = demoAdminUsers.map((u, i) => (i === index ? updated : u));
    return delay({ ...updated });
  },

  async adminListContactMessages(): Promise<AdminContactMessage[]> {
    requireUser();
    return delay([]);
  },

  async adminMarkContactRead(id: string): Promise<AdminContactMessage> {
    requireUser();
    return delay({
      id,
      name: 'Demo',
      email: 'demo@kia.academy',
      subject: 'Demo message',
      message: 'Demo',
      readAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  },

  async getSettings(): Promise<SiteSettings> {
    return delay(toPublicSiteSettings(readDemoSettings()));
  },

  async adminGetSettings(): Promise<SiteSettings> {
    requireUser();
    return delay(readDemoSettings());
  },

  async adminUpdateSettings(dto: UpdateSiteSettingsDto): Promise<SiteSettings> {
    requireUser();
    const next = mergeSiteSettings(readDemoSettings(), dto);
    writeDemoSettings(next);
    return delay(next);
  },

  async getPersonalityBank(): Promise<PersonalityBank> {
    return delay(readDemoTestBank('personality').bank as PersonalityBank);
  },

  async getAssessmentBank(): Promise<AssessmentBank> {
    return delay(readDemoTestBank('assessment').bank as AssessmentBank);
  },

  async adminListTestBanks(): Promise<TestBankMeta[]> {
    requireUser();
    return delay(
      (['personality', 'assessment', 'readiness'] as TestBankId[]).map((id) => {
        const payload = readDemoTestBank(id);
        const count =
          id === 'personality'
            ? (payload.bank as PersonalityBank).items.length
            : id === 'assessment'
              ? (payload.bank as AssessmentBank).questions.length
              : (payload.bank as ReadinessBank).questions.length;
        return { id, updatedAt: new Date().toISOString(), questionCount: count };
      }),
    );
  },

  async adminGetTestBank(id: TestBankId): Promise<TestBankPayload> {
    requireUser();
    return delay(readDemoTestBank(id));
  },

  async adminSaveTestBank(id: TestBankId, bank: unknown): Promise<TestBankPayload> {
    requireUser();
    const payload = { id, bank } as TestBankPayload;
    writeDemoTestBank(payload);
    return delay(payload);
  },

  async adminResetTestBank(id: TestBankId): Promise<TestBankPayload> {
    requireUser();
    const payload = defaultDemoTestBank(id);
    writeDemoTestBank(payload);
    return delay(payload);
  },
};

function defaultDemoTestBank(id: TestBankId): TestBankPayload {
  if (id === 'personality') {
    return {
      id,
      bank: {
        version: 1,
        citation: MINI_IPIP_CITATION,
        items: MINI_IPIP_ITEMS.map((item) => ({ ...item })),
      },
    };
  }
  if (id === 'assessment') {
    return { id, bank: structuredClone(DEFAULT_ASSESSMENT_BANK) };
  }
  return {
    id,
    bank: { version: 1, questions: structuredClone(EXAM_QUESTION_BANK) },
  };
}

function readDemoTestBank(id: TestBankId): TestBankPayload {
  if (typeof window === 'undefined') return defaultDemoTestBank(id);
  try {
    const raw = localStorage.getItem(DEMO_TEST_BANKS_KEY);
    if (!raw) return defaultDemoTestBank(id);
    const all = JSON.parse(raw) as Partial<Record<TestBankId, TestBankPayload>>;
    return all[id] ?? defaultDemoTestBank(id);
  } catch {
    return defaultDemoTestBank(id);
  }
}

function writeDemoTestBank(payload: TestBankPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DEMO_TEST_BANKS_KEY);
    const all = raw
      ? (JSON.parse(raw) as Partial<Record<TestBankId, TestBankPayload>>)
      : {};
    all[payload.id] = payload;
    localStorage.setItem(DEMO_TEST_BANKS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function readDemoSettings(): SiteSettings {
  if (typeof window === 'undefined') return createDefaultSiteSettings();
  try {
    const raw = localStorage.getItem(DEMO_SETTINGS_KEY);
    if (!raw) return createDefaultSiteSettings();
    return mergeSiteSettings(createDefaultSiteSettings(), JSON.parse(raw) as SiteSettings);
  } catch {
    return createDefaultSiteSettings();
  }
}

function writeDemoSettings(settings: SiteSettings): void {
  if (typeof window === 'undefined') return;
  // Never persist payment/SMS secrets in browser storage (demo/Pages only).
  const sanitized: SiteSettings = {
    ...settings,
    payment: {
      ...settings.payment,
      apiKey: '',
      merchantId: '',
    },
    sms: {
      ...settings.sms,
      apiKey: '',
    },
  };
  localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify(sanitized));
}


function fileToDataUrl(file: File): Promise<string> {
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    return Promise.reject(new ApiError('Demo mode supports videos up to 25 MB', 400));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError('Failed to read video file', 400));
    reader.readAsDataURL(file);
  });
}

/** Ensure a signed-in demo session exists for browsing the full static site. */
export function ensureDemoSession(): AuthUser {
  const existing = readSession();
  if (existing) return existing;
  writeSession(DEMO_LEARNER);
  return DEMO_LEARNER;
}
