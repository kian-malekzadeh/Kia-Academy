/**
 * Card accents — the palette of the shared card tile (`styles/base.css`).
 *
 * A tile picks its hue with a `tint--*` class; nothing else about a card is
 * allowed to differ between places. Courses get a hue from their slug so a
 * course keeps its colour everywhere it appears, and `assignCardAccents` makes
 * sure a single grid never shows the same hue twice: the first course to claim
 * a hue keeps it and the next one takes the first free hue.
 */

export const CARD_ACCENTS = ['brand', 'sky', 'mint', 'amber', 'rose', 'violet'] as const;

export type CardAccent = (typeof CARD_ACCENTS)[number];

export function tintClass(accent: CardAccent): string {
  return `tint--${accent}`;
}

/** FNV-1a: small, stable, and spreads short slugs across the palette. */
function hashSlug(slug: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash);
}

/**
 * One accent per slug, no duplicates while there are free hues left. Beyond
 * `CARD_ACCENTS.length` courses the palette repeats — that is the point of a
 * six-hue set, and the first courses keep the distinct hues.
 */
export function assignCardAccents(slugs: readonly string[]): CardAccent[] {
  const taken = new Set<CardAccent>();
  return slugs.map((slug) => {
    const preferred = CARD_ACCENTS[hashSlug(slug) % CARD_ACCENTS.length];
    if (!taken.has(preferred)) {
      taken.add(preferred);
      return preferred;
    }
    const free = CARD_ACCENTS.find((accent) => !taken.has(accent));
    if (!free) return preferred;
    taken.add(free);
    return free;
  });
}
