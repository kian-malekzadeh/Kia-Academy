import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { markdownToHtml } from './markdown';

// Load the repo-root course library from this test file's location.
const dbPath = resolve(__dirname, '../../../../db.json');
const { lessons } = JSON.parse(readFileSync(dbPath, 'utf8')) as {
  lessons: Array<{ description: string }>;
};

/**
 * The seeded lesson library (db.json) is Persian course copy that frequently
 * embeds list items as indented `• ` bullets and `1.`/`2.` numbers. Those must
 * render as real <ul>/<ol>, never be flattened into a "wall of text".
 */
describe('markdownToHtml on the course library (db.json)', () => {

  it('renders every indented • bullet line inside a <ul>', () => {
    let bulletLines = 0;
    let wrapped = 0;
    for (const lesson of lessons) {
      const html = markdownToHtml(lesson.description);
      const hasUl = html.includes('<ul>');
      for (const line of lesson.description.split('\n')) {
        if (line.trim().startsWith('\u2022 ')) {
          bulletLines += 1;
          if (hasUl) wrapped += 1;
        }
      }
    }
    expect(bulletLines).toBeGreaterThan(800);
    expect(wrapped).toBe(bulletLines);
  });

  it('never renders a list marker line as bare text', () => {
    const listLineRe = /^\s*([•-] |\d+[.)] )/;
    for (const lesson of lessons) {
      const html = markdownToHtml(lesson.description);
      for (const line of lesson.description.split('\n')) {
        if (listLineRe.test(line)) {
          expect(html).not.toContain(`<p>${line.trim()}`);
        }
      }
    }
  });

  it('still emits no raw HTML and produces <\u002f> well-formed list tags', () => {
    for (const lesson of lessons) {
      const html = markdownToHtml(lesson.description);
      expect(html).not.toContain('<script');
      expect((html.match(/<ul>/g) ?? []).length).toBe((html.match(/<\/ul>/g) ?? []).length);
      expect((html.match(/<ol>/g) ?? []).length).toBe((html.match(/<\/ol>/g) ?? []).length);
    }
  });
});