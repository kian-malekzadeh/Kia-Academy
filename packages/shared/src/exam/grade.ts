import {
  EXAM_DOMAINS,
  EXAM_PASS_THRESHOLD,
  type ExamDomainId,
  type ExamDomainScore,
  type ExamQuestion,
  type ExamResponse,
  type PublicExamQuestion,
} from './types';

export function toPublicQuestion(q: ExamQuestion): PublicExamQuestion {
  const { answer: _answer, ...rest } = q;
  return rest;
}

/** Fisher–Yates shuffle (copy). */
export function shuffleCopy<T>(items: T[], rng: () => number = Math.random): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

/** Public questions for a live attempt — answers stripped, order items shuffled. */
export function toPublicExamQuestions(
  questions: ExamQuestion[],
  rng: () => number = Math.random,
): PublicExamQuestion[] {
  return questions.map((q) => {
    const pub = toPublicQuestion(q);
    if (pub.orderItems?.length) {
      return { ...pub, orderItems: shuffleCopy(pub.orderItems, rng) };
    }
    if (pub.options?.length && (q.type === 'single_choice' || q.type === 'multi_choice')) {
      return { ...pub, options: shuffleCopy(pub.options, rng) };
    }
    return pub;
  });
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((id, i) => id === right[i]);
}

function sameSequence(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}

export function gradeResponse(
  q: ExamQuestion,
  response: ExamResponse | undefined,
): boolean {
  if (!response || response.type !== q.type) return false;

  switch (q.type) {
    case 'single_choice': {
      if (response.type !== 'single_choice') return false;
      return response.optionId === q.answer;
    }
    case 'multi_choice': {
      if (response.type !== 'multi_choice') return false;
      const expected = Array.isArray(q.answer) ? q.answer : [q.answer];
      return sameSet(response.optionIds, expected);
    }
    case 'order': {
      if (response.type !== 'order') return false;
      const expected = Array.isArray(q.answer) ? q.answer : [q.answer];
      return sameSequence(response.orderedIds, expected);
    }
    case 'fill_blank': {
      if (response.type !== 'fill_blank') return false;
      const expected = Array.isArray(q.answer) ? q.answer : [q.answer];
      const blankCount = q.blanks ?? expected.length;
      if (response.values.length !== blankCount || expected.length !== blankCount) {
        return false;
      }
      return response.values.every(
        (value, i) => value.trim().toLowerCase() === expected[i],
      );
    }
    default:
      return false;
  }
}

export function gradeAttempt(
  questions: ExamQuestion[],
  answers: Record<string, ExamResponse>,
): {
  domainScores: ExamDomainScore[];
  percentages: Record<string, number>;
  average: number;
  passed: boolean;
} {
  const byDomain = new Map<
    ExamDomainId,
    { correct: number; total: number }
  >();

  for (const domain of EXAM_DOMAINS) {
    byDomain.set(domain, { correct: 0, total: 0 });
  }

  for (const q of questions) {
    const bucket = byDomain.get(q.domain) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (gradeResponse(q, answers[q.id])) {
      bucket.correct += 1;
    }
    byDomain.set(q.domain, bucket);
  }

  const domainScores: ExamDomainScore[] = EXAM_DOMAINS.map((domain) => {
    const { correct, total } = byDomain.get(domain) ?? { correct: 0, total: 0 };
    const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
    return { domain, correct, total, percent };
  });

  const percentages: Record<string, number> = {};
  for (const score of domainScores) {
    percentages[score.domain] = score.percent;
  }

  const average =
    domainScores.length === 0
      ? 0
      : Math.round(
          domainScores.reduce((sum, s) => sum + s.percent, 0) / domainScores.length,
        );

  const passed = average >= EXAM_PASS_THRESHOLD;

  return { domainScores, percentages, average, passed };
}
