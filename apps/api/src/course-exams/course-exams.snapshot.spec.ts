import { CourseExamsService } from './course-exams.service';
import type { CourseExamQuestion } from '@kia-academy/shared';

/**
 * EXAM-3: question snapshots must be pinned when an attempt starts, and grading
 * must use the pinned snapshot — never the live (admin-editable) exam payload.
 */

function makeQuestion(id: string, answer: string): CourseExamQuestion {
  return {
    id,
    type: 'single_choice',
    prompt: `Prompt for ${id}`,
    options: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    answer,
  };
}

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    courseExam: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: 0 } }),
    },      courseExamAttempt: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => ({
          id: 'at-new',
          examId: 'exam-1',
          userId: 'u1',
          status: 'IN_PROGRESS',
          questions: args.data.questions ?? null,
          answers: {},
          startedAt: new Date(),
          submittedAt: null,
          score: null,
          passed: null,
        })),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    enrollment: { findFirst: jest.fn().mockResolvedValue({ id: 'e1' }) },
    course: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
    lesson: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
    $transaction: jest.fn(),
    ...overrides,
  };
}

function makeService(prisma: Record<string, unknown>) {
  return new CourseExamsService(prisma as never);
}

const examRow = {
  id: 'exam-1',
  courseId: 'c1',
  title: 'Final exam',
  description: '',
  passScore: 60,
  durationMin: 15,
  published: true,
  sortOrder: 1,
  kind: 'FINAL',
  afterLessonId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  course: { slug: 'javascript', title: 'JavaScript' },
  afterLesson: null,
};

const liveQuestions = [makeQuestion('q1', 'a')];

describe('CourseExamsService EXAM-3 question snapshots', () => {
  it('pins the live question payload on the attempt at start', async () => {
    const prisma = makePrisma({
      courseExam: {
        ...makePrisma().courseExam,
        findUnique: jest.fn().mockResolvedValue({
          ...examRow,
          questions: liveQuestions,
        }),
      },
    });
    const service = makeService(prisma);
    await service.startAttempt('u1', 'exam-1');

    expect(prisma.courseExamAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          examId: 'exam-1',
          userId: 'u1',
          status: 'IN_PROGRESS',
          questions: liveQuestions,
        }),
      }),
    );
  });

  it('serves the pinned snapshot to a resumed attempt, not live edits', async () => {
    const pinned = [makeQuestion('q1', 'a'), makeQuestion('q2', 'b')];
    const editedLive = [makeQuestion('q1', 'a')]; // admin deleted q2 mid-attempt
    const prisma = makePrisma({
      courseExam: {
        ...makePrisma().courseExam,
        findUnique: jest.fn().mockResolvedValue({
          ...examRow,
          questions: editedLive,
        }),
      },
      courseExamAttempt: {
        ...makePrisma().courseExamAttempt,
        findFirst: jest.fn().mockResolvedValue({
          id: 'at-1',
          examId: 'exam-1',
          userId: 'u1',
          status: 'IN_PROGRESS',
          questions: pinned,
          answers: {},
          startedAt: new Date(),
        }),
      },
    });
    const service = makeService(prisma);
    const session = await service.startAttempt('u1', 'exam-1');

    expect(session.questions.map((q) => q.id)).toEqual(['q1', 'q2']);
  });

  it('grades a submission against the pinned snapshot after admin edits', async () => {
    const pinned = [makeQuestion('q1', 'a')];
    const editedLive = [
      makeQuestion('q1', 'b'), // admin flipped the correct answer mid-attempt
    ];
    const prisma = makePrisma({
      courseExam: {
        ...makePrisma().courseExam,
        findUnique: jest.fn().mockResolvedValue({
          ...examRow,
          questions: editedLive,
        }),
      },
      courseExamAttempt: {
        ...makePrisma().courseExamAttempt,
        findFirst: jest.fn().mockResolvedValue({
          id: 'at-1',
          examId: 'exam-1',
          userId: 'u1',
          status: 'IN_PROGRESS',
          questions: pinned,
          answers: {},
          startedAt: new Date(Date.now() - 60_000),
          submittedAt: null,
          score: null,
          passed: null,
        }),
      },
    });
    // The post-claim update persists the graded result.
    prisma.courseExamAttempt.update = jest.fn().mockResolvedValue({
      id: 'at-1',
      status: 'SUBMITTED',
      score: 100,
      passed: true,
      submittedAt: new Date(),
      answers: {},
      questions: pinned,
    });

    const service = makeService(prisma);
    const result = await service.submitAttempt('u1', 'at-1', {
      answers: { q1: { type: 'single_choice', optionId: 'a' } },
    });

    // Snapshot says 'a' is correct even though the live bank now says 'b'.
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.details).toEqual([{ questionId: 'q1', correct: true, points: 1 }]);
  });

  it('falls back to the live payload for legacy attempts without a snapshot', async () => {
    const prisma = makePrisma({
      courseExam: {
        ...makePrisma().courseExam,
        findUnique: jest.fn().mockResolvedValue({
          ...examRow,
          questions: liveQuestions,
        }),
      },
      courseExamAttempt: {
        ...makePrisma().courseExamAttempt,
        findFirst: jest.fn().mockResolvedValue({
          id: 'at-legacy',
          examId: 'exam-1',
          userId: 'u1',
          status: 'IN_PROGRESS',
          questions: null, // pre-EXAM-3 attempt
          answers: {},
          startedAt: new Date(Date.now() - 60_000),
          submittedAt: null,
          score: null,
          passed: null,
        }),
      },
    });
    prisma.courseExamAttempt.update = jest.fn().mockResolvedValue({
      id: 'at-legacy',
      status: 'SUBMITTED',
      score: 0,
      passed: false,
      submittedAt: new Date(),
      answers: {},
      questions: null,
    });

    const service = makeService(prisma);
    const result = await service.submitAttempt('u1', 'at-legacy', {
      answers: { q1: { type: 'single_choice', optionId: 'b' } },
    });

    // Live payload (answer 'a') grades the legacy attempt.
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });
});
