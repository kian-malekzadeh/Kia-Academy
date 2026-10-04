import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Course tiles used to repeat the course description under the title. It was a
 * 2–3 line wall of text in a 4-card grid (measured 103.56px on two tiles and
 * 51.78px on two others at 1280px), which stretched the rows unevenly: 365.34px
 * against 313.56px. Both grids share the `.catalog-card` tile, so the tiles now
 * read icon → title → meta → CTA and every card is 249.78px.
 *
 * These tests pin the removal in *both* grids — the public catalog and the
 * dashboard's "my courses" — so a description cannot creep back into one of them
 * while the other stays clean.
 */

const read = (rel: string) => readFileSync(path.join(__dirname, rel), 'utf8');

const publicPage = read('public-page.tsx');
const myCourses = read('../dashboard/my-courses/page.tsx');
const catalogCss = read('../../styles/catalog-lesson.css');

/** The single `<article className="catalog-card">` each grid renders. */
const cardOf = (src: string) => {
  const start = src.indexOf('className={`catalog-card');
  expect(start).toBeGreaterThan(-1);
  const end = src.indexOf('</article>', start);
  expect(end).toBeGreaterThan(start);
  return src.slice(start, end);
};

const card = {
  publicCatalog: cardOf(publicPage),
  myCourses: cardOf(myCourses),
};

describe('course card description', () => {
  it('renders no course description in either card grid', () => {
    // Scoped to the card, not the file: a page-level intro may still use it
    // (`CourseDetail` shows it under the title on purpose).
    expect(card.publicCatalog).not.toContain('course.description');
    expect(card.myCourses).not.toContain('course.description');
  });

  it('keeps the card structure the tile CSS relies on', () => {
    // icon → title → meta → actions. The meta row carries the hairline that
    // separates the tile from its CTA, so it must not be dropped with the text.
    for (const [name, markup] of Object.entries(card)) {
      const icon = markup.indexOf('<CourseTileIcon');
      const title = markup.indexOf('<h3>');
      const meta = markup.indexOf('className="catalog-meta"');
      const actions = markup.indexOf('className="catalog-actions"');
      expect(icon, name).toBeGreaterThan(-1);
      expect(title, name).toBeGreaterThan(icon);
      expect(meta, name).toBeGreaterThan(title);
      expect(actions, name).toBeGreaterThan(meta);
    }
  });

  it('keeps the `.catalog-card p` rule the attachments line still needs', () => {
    // Removing the description did NOT make this rule dead: the dashboard card
    // still renders a `<p className="panel-muted">` for "no attachments yet",
    // and `.catalog-card p` is what gives it its size and colour.
    expect(myCourses).toContain('<p className="panel-muted">');
    expect(catalogCss).toMatch(/\.catalog-card p \{[^}]*font-size: var\(--fs-sm\);[^}]*\}/);
  });

  it('leaves the tile height floor to the shared card rule', () => {
    // The cards shrank on their own (249.78px against a 208px `min-height`),
    // so no per-grid override was needed — and none may creep in, or the
    // dashboard grid would drift from the public one.
    expect(catalogCss).not.toMatch(/\.catalog-card\s*\{[^}]*min-height:\s*0/);
    expect(catalogCss).not.toMatch(/\.catalog-actions\s*\{[^}]*margin-top:\s*auto/);
  });
});