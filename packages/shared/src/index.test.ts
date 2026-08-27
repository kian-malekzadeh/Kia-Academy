import { describe, it, expect } from 'vitest';
import { TRACKS, MODULE_PRICES } from './constants/tracks';
import { scoreFizzBuzz } from './utils/challenge';
import { computeReadinessResult } from './utils/readiness';

describe('tracks', () => {
  it('has 5 modules per track', () => {
    Object.values(TRACKS).forEach((track) => {
      expect(track.modules).toHaveLength(5);
    });
  });

  it('has matching price count', () => {
    expect(MODULE_PRICES).toHaveLength(5);
  });
});

describe('scoreFizzBuzz', () => {
  it('scores a full solution', () => {
    const code = `function fizzbuzz(n) {
      const f3 = n % 3 === 0;
      const f5 = n % 5 === 0;
      return f3 && f5 ? "FizzBuzz" : f3 ? "Fizz" : f5 ? "Buzz" : n;
    }`;
    expect(scoreFizzBuzz(code)).toBe(100);
  });
});

describe('computeReadinessResult', () => {
  it('passes at 60+', () => {
    const result = computeReadinessResult({
      'Computer Literacy': { correct: 1, total: 1 },
      'English Readiness': { correct: 2, total: 2 },
      'Algorithmic Thinking': { correct: 3, total: 4 },
      Flowcharts: { correct: 4, total: 5 },
      'Programming Fundamentals': { correct: 2, total: 3 },
    });
    expect(result.passed).toBe(true);
  });
});
