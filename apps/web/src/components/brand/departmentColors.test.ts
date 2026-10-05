import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Kia Group colour separation.
 *
 * Three rules, and the second exists only because of the first:
 *
 * 1. Every department owns one colour, and its tile *and* its logo both read
 *    from it — a card in the hub and the page it opens can never drift apart.
 * 2. `--group-gold` (#ffc864) is Kia Group's alone. No department may use it.
 *    This is not free: `--amber-400` has always been #ffc864, and `tint--amber`
 *    is painted on tiles that live *inside* department pages, so its fill had
 *    to move to `--amber-500` or gold would show up inside a department.
 * 3. The six values are the brand's published hexes, and each fill carries
 *    whichever ink actually reads on it.
 *
 * The tests read the tokens out of the stylesheet and check the arithmetic, so
 * a "close enough" colour cannot slip in: the exact official hexes, six
 * distinct values, and measured contrast for the ink.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STYLES = path.join(HERE, '..', '..', 'styles');
const read = (f: string) => readFileSync(path.join(STYLES, f), 'utf8');

const base = read('base.css');

const PARENT_GOLD = '#ffc864';
const SLUGS = ['academy', 'work', 'material', 'events', 'community', 'labs'] as const;

const token = (name: string) => {
  const m = base.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  expect(m, `${name} must be defined as a hex token`).not.toBeNull();
  return m?.[1].toLowerCase() ?? '';
};

const deptColour = (slug: string) => token(`dept-${slug}`);

describe('Kia Group parent colour', () => {
  it('reserves #ffc864 for Kia Group', () => {
    expect(token('group-gold')).toBe(PARENT_GOLD);
  });

  it('paints every parent-brand emblem in that gold', () => {
    // The KIA Group emblem: rail, footer, guest landing, auth pages, admin.
    for (const [file, selector] of [
      ['layout.css', '.logo-mark'],
      ['footer-nav.css', '.footer-logo-mark'],
      ['landing.css', '.landing-brand-mark'],
      ['auth.css', '.education-brand-mark'],
      ['admin.css', '.admin-brand-mark'],
    ] as const) {
      const rule = read(file).match(new RegExp(`\\${selector} \\{[^}]*\\}`));
      expect(rule, `${file}: ${selector}`).not.toBeNull();
      expect(rule?.[0], `${file}: ${selector}`).toMatch(/color: var\(--group-gold\);/);
    }
  });
});

describe('department colours', () => {
  it('gives each department its own colour', () => {
    const colours = SLUGS.map(deptColour);
    expect(colours.filter(Boolean)).toHaveLength(6);
    expect(new Set(colours).size, 'departments must not share a colour').toBe(6);
  });

  it('keeps #ffc864 out of every department', () => {
    for (const slug of SLUGS) {
      expect(deptColour(slug), slug).not.toBe(PARENT_GOLD);
    }
  });

  it('carries the official logo colours verbatim', () => {
    // These six hexes are Kia Group's published brand values, not a palette
    // tuned for this UI. The previous "spread the hues" rule is deliberately
    // gone: measured on the official set, material and labs sit 16.4° apart
    // (both read as green), academy and work are both blues 29° apart, and
    // events lands 14.9° from the parent gold — so any hue-spread or
    // one-blue-only rule would forbid the brand's own colours. The values are
    // the specification now, and this test is what keeps them exact.
    expect(Object.fromEntries(SLUGS.map((slug) => [slug, deptColour(slug)]))).toEqual({
      academy: '#6464ff',
      work: '#1687ff',
      material: '#20bfa9',
      events: '#ff8a3d',
      community: '#d946ef',
      labs: '#19c37d',
    });
  });

  it('puts the more readable ink on every fill', () => {
    // The official colours are light, so ink choice is a measurement, not a
    // preference: white on labs' green is 2.3:1, the dark ink is 7.9:1. Each
    // tile must wear whichever of the two wins, which also means a future
    // recolour cannot quietly leave white ink on a pale fill.
    const DARK = token('ink-950');
    const luminance = (hex: string) => {
      const m = /^#(..)(..)(..)$/.exec(hex);
      if (!m) throw new Error(`not a hex colour: ${hex}`);
      const channel = (n: string) => {
        const c = parseInt(n, 16) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      const [r, g, b] = [m[1], m[2], m[3]].map(channel);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a: string, b: string) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    for (const slug of SLUGS) {
      const fill = deptColour(slug);
      const rule = base.match(new RegExp(`\\.dept--${slug} \\{[^}]*\\}`));
      const declared = rule?.[0].match(/--tile-on-fill:\s*([^;]+);/)?.[1].trim() ?? '';
      const ink = declared === '#ffffff' ? '#ffffff' : DARK;
      expect(declared, `${slug} must read one of the two inks`).toMatch(
        new RegExp(`^(#ffffff|var\\(--ink-950\\))$`),
      );
      const white = contrast(fill, '#ffffff');
      const dark = contrast(fill, DARK);
      const best = Math.max(white, dark);
      const chosen = ink === '#ffffff' ? white : dark;
      expect(
        chosen,
        `${slug}: ${ink} measures ${chosen.toFixed(2)}:1 on ${fill}, the better of the two is ${best.toFixed(2)}:1`,
      ).toBeCloseTo(best, 5);
    }
  });

  it('gives KIA Academy blue, as the brand specifies', () => {
    // #6464ff reads as blue; it is also the long-standing academy hue, so the
    // department keeps its identity through the rebrand.
    const [, r, g, b] = /^#(..)(..)(..)$/.exec(deptColour('academy')) ?? [];
    const [red, green, blue] = [r, g, b].map((n) => parseInt(n, 16));
    expect(blue).toBeGreaterThan(red);
    expect(blue).toBeGreaterThan(green);
  });

  it('paints each department tile from its own token', () => {
    for (const slug of SLUGS) {
      expect(base, slug).toMatch(
        new RegExp(`\\.dept--${slug} \\{\\s*\\n\\s*--dept: var\\(--dept-${slug}\\);`),
      );
    }
    // Tile surface, hairline, tint and hover all derive from that one token.
    const shared = base.match(/\.dept--academy,\n\.dept--work,[\s\S]*?\n\}/);
    expect(shared).not.toBeNull();
    expect(shared?.[0]).toMatch(/--tile-fill: var\(--dept\);/);
    expect(shared?.[0]).toMatch(/--tile-border-hover: var\(--dept\);/);
  });

  it('paints each department logo from the same token as its tile', () => {
    for (const slug of SLUGS) {
      expect(base, slug).toMatch(
        new RegExp(`\\.dept-mark--${slug} \\{ color: var\\(--dept-${slug}\\); \\}`),
      );
    }
  });

  it('never lets an amber tile wear the parent gold', () => {
    // `tint--amber` paints sub-tiles that live inside department pages.
    const rule = base.match(/\.tint--amber \{[^}]*\}/);
    expect(rule).not.toBeNull();
    expect(rule?.[0]).toMatch(/--tile-fill: var\(--amber-500\);/);
    expect(rule?.[0]).not.toMatch(/--tile-fill: var\(--amber-400\);/);
  });
});

describe('department marks in the markup', () => {
  const hub = readFileSync(path.join(HERE, '..', 'hub', 'HubDoors.tsx'), 'utf8');
  const appDir = path.join(HERE, '..', '..', 'app');

  it('wears dept--<slug> on all six hub cards, never a generic tint', () => {
    // The card may carry a row modifier as well (UX-30 adds `door--strong` /
    // `door--soft`), so this looks for its own department class anywhere in the
    // list rather than pinning the class order.
    for (const slug of SLUGS) {
      expect(hub, slug).toMatch(new RegExp(`className="door[^"]*\\bdept--${slug}\\b`));
    }
    expect(hub).not.toMatch(/className="door[^"]*\btint--/);
  });

  it('splits the hub into a strong top row and a soft row that echoes it', () => {
    // UX-30: the top row is the department's official colour with a white
    // glyph; the bottom row borrows the hue of the card directly above it —
    // one per column — lightened, with a dark glyph.
    const links = [...hub.matchAll(/<Link[^>]*>/g)].map((m) => m[0]);
    expect(links).toHaveLength(6);
    const card = (href: string) => links.find((l) => l.includes(`href="${href}"`)) ?? '';

    for (const href of ['/tracks', '/events', '/material']) {
      expect(card(href), href).toContain('door--strong');
      expect(card(href), href).not.toMatch(/data-tone=/);
    }
    expect(card('/freelance')).toMatch(/data-tone="academy"/);
    expect(card('/community')).toMatch(/data-tone="events"/);
    expect(card('/labs')).toMatch(/data-tone="material"/);
    for (const href of ['/freelance', '/community', '/labs']) {
      expect(card(href), href).toContain('door--soft');
      // A soft card still carries its own department class.
      expect(card(href), href).toMatch(/\bdept--/);
    }
  });

  it('paints the soft row from a borrowed hue without re-declaring one', () => {
    // The treatment is hub-only: `.door--soft` must not touch `--dept`, or a
    // soft KIA Work tile would become KIA Work's identity everywhere.
    const soft = base.match(/^\.door--soft \{[^}]*\}/m);
    expect(soft?.[0]).toMatch(/--tile-fill: color-mix\(in srgb, var\(--tone\) 32%, #ffffff\);/);
    expect(soft?.[0]).toMatch(/--tile-on-fill: var\(--ink-950\);/);
    expect(soft?.[0]).not.toContain('--dept:');
    // The top row's glyph is white, whatever the fill's best ink would be.
    expect(base.match(/^\.door--strong \{[^}]*\}/m)?.[0]).toMatch(
      /--tile-on-fill: #ffffff;/,
    );

    // Every borrowed hue in the markup resolves to a department colour, so a
    // card can never tint itself with something that is not one of the six.
    const tones = [...hub.matchAll(/data-tone="(\w+)"/g)].map((m) => m[1]);
    expect(new Set(tones).size, 'one borrowed hue per column').toBe(3);
    for (const tone of tones) {
      expect(tone).toBeTypeOf('string');
      expect(base, tone).toContain(
        `.door--soft[data-tone='${tone}'] { --tone: var(--dept-${tone}); }`,
      );
    }
  });

  it('gives every department page a mark in its own colour', () => {
    const page = {
      academy: path.join(appDir, 'tracks', 'page.tsx'),
      work: path.join(appDir, 'freelance', 'page.tsx'),
      material: pathFile(path.join(appDir, '..', 'features', 'material', 'MaterialStudio.tsx')),
      events: path.join(appDir, 'events', 'page.tsx'),
      community: path.join(appDir, 'community', 'page.tsx'),
      labs: path.join(appDir, 'labs', 'page.tsx'),
    } as Record<string, string>;
    for (const [slug, file] of Object.entries(page)) {
      const src = readFileSync(file, 'utf8');
      expect(src, slug).toContain(`dept-mark dept-mark--${slug}`);
    }
  });

  it('paints a department’s own tile in its own colour', () => {
    // KIA Community’s page showed a `tint--violet` coming-soon tile — which is
    // Material's violet — beside its own logo. A department page must not
    // introduce a second department's colour.
    for (const slug of ['community', 'labs'] as const) {
      const src = readFileSync(path.join(appDir, slug, 'page.tsx'), 'utf8');
      expect(src, slug).toContain(`door--soon dept--${slug}`);
      expect(src, slug).not.toMatch(/door--soon tint--/);
    }
  });
});

function pathFile(p: string) {
  return path.normalize(p);
}