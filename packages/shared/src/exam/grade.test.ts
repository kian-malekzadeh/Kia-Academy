import { describe, expect, it } from 'vitest';
import { EXAM_QUESTION_BANK } from './bank';
import { gradeAttempt, gradeResponse, toPublicExamQuestions, toPublicQuestion } from './grade';
import { buildExamOutcome, buildExamVerdict } from './outcome';

describe('exam grading', () => {
  it('strips answers from public questions', () => {
    const q = EXAM_QUESTION_BANK[0]!;
    const pub = toPublicQuestion(q);
    expect(pub).not.toHaveProperty('answer');
    expect(pub.id).toBe(q.id);
  });

  it('grades a perfect attempt as passed', () => {
    const answers = Object.fromEntries(
      EXAM_QUESTION_BANK.map((q) => {
        if (q.type === 'single_choice') {
          return [q.id, { type: 'single_choice' as const, optionId: q.answer as string }];
        }
        if (q.type === 'multi_choice') {
          return [
            q.id,
            { type: 'multi_choice' as const, optionIds: [...(q.answer as string[])] },
          ];
        }
        if (q.type === 'order') {
          return [
            q.id,
            { type: 'order' as const, orderedIds: [...(q.answer as string[])] },
          ];
        }
        return [
          q.id,
          { type: 'fill_blank' as const, values: [...(q.answer as string[])] },
        ];
      }),
    );

    const graded = gradeAttempt(EXAM_QUESTION_BANK, answers);
    expect(graded.average).toBe(100);
    expect(graded.passed).toBe(true);
    expect(graded.domainScores).toHaveLength(5);
  });

  it('rejects wrong fill_blank casing only after normalize', () => {
    const q = EXAM_QUESTION_BANK.find((item) => item.id === 'do-04')!;
    expect(
      gradeResponse(q, { type: 'fill_blank', values: ['C'] }),
    ).toBe(true);
    expect(
      gradeResponse(q, { type: 'fill_blank', values: ['x'] }),
    ).toBe(false);
  });

  it('applies refresher modules on fail and unlocks on pass', () => {
    const roadmap = {
      id: 'rm-1',
      modules: ['JavaScript Core', 'React Fundamentals'],
      level: 'absoluteBeginner',
    };

    const failOutcome = buildExamOutcome({
      passed: false,
      average: 40,
      percentages: {
        digitalOps: 25,
        logicalReasoning: 50,
        techReading: 75,
        codeSense: 25,
        problemSolving: 25,
      },
      roadmap,
    });
    expect(failOutcome.refreshersInserted.length).toBeGreaterThan(0);
    expect(failOutcome.roadmapModules[0]).toMatch(/^Refresher:/);
    expect(failOutcome.modulesUnlocked).toEqual([]);

    const passOutcome = buildExamOutcome({
      passed: true,
      average: 90,
      percentages: {
        digitalOps: 100,
        logicalReasoning: 100,
        techReading: 75,
        codeSense: 100,
        problemSolving: 75,
      },
      roadmap,
    });
    expect(passOutcome.modulesUnlocked).toEqual(['JavaScript Core']);
    expect(passOutcome.levelAfter).toBe('confidentBeginner');
    expect(buildExamVerdict({ passed: true, average: 90, outcome: passOutcome }).variant).toBe(
      'success',
    );
  });

  it('shuffles order items without dropping ids', () => {
    const orderQ = EXAM_QUESTION_BANK.find((q) => q.type === 'order')!;
    const [pub] = toPublicExamQuestions([orderQ], () => 0.99);
    expect(pub!.orderItems?.map((i) => i.id).sort()).toEqual(
      orderQ.orderItems!.map((i) => i.id).sort(),
    );
    expect(pub).not.toHaveProperty('answer');
  });
});
