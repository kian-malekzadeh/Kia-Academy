import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CARD_ACCENTS, assignCardAccents, tintClass } from './cardAccent';

const BASE_CSS = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'styles', 'base.css'),
  'utf8',
);

describe('card accents', () => {
  it('gives a course the same accent everywhere it appears', () => {
    const slug = 'html-basics';
    expect(assignCardAccents([slug])).toEqual(assignCardAccents([slug]));
    expect(assignCardAccents([slug, 'other'])[0]).toEqual(assignCardAccents([slug])[0]);
  });

  it('never repeats an accent inside one grid', () => {
    const slugs = ['html', 'css', 'javascript', 'interview-branding', 'ux', 'database'];
    const accents = assignCardAccents(slugs);
    expect(accents).toHaveLength(slugs.length);
    expect(new Set(accents).size).toBe(slugs.length);
  });

  it('moves a course to a free hue when its own hue is already taken', () => {
    const all = Array.from({ length: CARD_ACCENTS.length }, (_, i) => `course-${i}`);
    const accents = assignCardAccents(all);
    expect(new Set(accents).size).toBe(CARD_ACCENTS.length);
  });

  it('repeats the palette for grids larger than the palette', () => {
    const slugs = Array.from({ length: CARD_ACCENTS.length + 2 }, (_, i) => `course-${i}`);
    const accents = assignCardAccents(slugs);
    expect(accents).toHaveLength(slugs.length);
    expect(accents.every((accent) => CARD_ACCENTS.includes(accent))).toBe(true);
  });

  it('has a tint class for every accent in the shared card tile', () => {
    for (const accent of CARD_ACCENTS) {
      expect(tintClass(accent)).toBe(`tint--${accent}`);
      expect(BASE_CSS).toContain(`.${tintClass(accent)} {`);
    }
  });
});
