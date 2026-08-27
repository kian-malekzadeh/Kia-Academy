import { describe, expect, it } from 'vitest';
import { isWizardStageValid } from '@/components/wizard/wizardOptions';

describe('isWizardStageValid', () => {
  const base = {
    goal: null as null | 'job',
    skills: {} as Record<string, 'Beginner'>,
    interests: [] as Array<'web'>,
    style: null as null | 'video',
  };

  it('requires a goal on stage 0', () => {
    expect(isWizardStageValid(0, base)).toBe(false);
    expect(isWizardStageValid(0, { ...base, goal: 'job' })).toBe(true);
  });

  it('requires three skills on stage 1', () => {
    expect(isWizardStageValid(1, base)).toBe(false);
    expect(
      isWizardStageValid(1, {
        ...base,
        skills: { 'HTML/CSS': 'Beginner', JavaScript: 'Beginner', Python: 'Beginner' },
      }),
    ).toBe(true);
  });

  it('requires at least one interest on stage 3', () => {
    expect(isWizardStageValid(3, base)).toBe(false);
    expect(isWizardStageValid(3, { ...base, interests: ['web'] })).toBe(true);
  });

  it('requires a learning style on stage 4', () => {
    expect(isWizardStageValid(4, base)).toBe(false);
    expect(isWizardStageValid(4, { ...base, style: 'video' })).toBe(true);
  });
});
