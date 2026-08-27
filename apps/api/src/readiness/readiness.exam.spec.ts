import { ReadinessService } from './readiness.service';
import {
  EXAM_QUESTION_BANK,
  gradeAttempt,
  buildExamOutcome,
} from '@kia-academy/shared';

describe('ReadinessService exam helpers', () => {
  it('grades bank questions server-side without trusting client scores', () => {
    const answers = Object.fromEntries(
      EXAM_QUESTION_BANK.map((q) => {
        if (q.type === 'single_choice') {
          return [q.id, { type: 'single_choice' as const, optionId: 'zzz' }];
        }
        if (q.type === 'multi_choice') {
          return [q.id, { type: 'multi_choice' as const, optionIds: [] }];
        }
        if (q.type === 'order') {
          return [q.id, { type: 'order' as const, orderedIds: [] }];
        }
        return [q.id, { type: 'fill_blank' as const, values: ['wrong'] }];
      }),
    );

    const graded = gradeAttempt(EXAM_QUESTION_BANK, answers);
    expect(graded.passed).toBe(false);
    expect(graded.average).toBe(0);

    const outcome = buildExamOutcome({
      passed: false,
      average: 0,
      percentages: graded.percentages,
      roadmap: {
        id: 'r1',
        modules: ['JavaScript Core'],
        level: 'absoluteBeginner',
      },
    });
    expect(outcome.refreshersInserted.length).toBe(5);
    expect(outcome.roadmapModules[0]?.startsWith('Refresher:')).toBe(true);
  });

  it('exports ReadinessService', () => {
    expect(ReadinessService).toBeDefined();
  });
});
