'use client';

import {
  BarChart3,
  BookOpen,
  Briefcase,
  Camera,
  Code2,
  Database,
  Globe,
  Megaphone,
  Palette,
  Rocket,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';

/**
 * Course marks are free-form keywords or emoji coming from the API (`code`,
 * `palette`, `briefcase`, …). The shared card tile draws them in a 44px accent
 * square, where a long word would be clipped — so a known keyword becomes a
 * lucide glyph and anything else falls back to a short mark that always fits.
 */

const BY_KEYWORD: Record<string, LucideIcon> = {
  code: Code2,
  html: Code2,
  css: Palette,
  javascript: Code2,
  js: Code2,
  ts: Code2,
  python: Code2,
  react: Code2,
  palette: Palette,
  design: Palette,
  ui: Palette,
  ux: Palette,
  briefcase: Briefcase,
  career: Briefcase,
  interview: Briefcase,
  business: Briefcase,
  globe: Globe,
  language: Globe,
  english: Globe,
  vocab: Globe,
  database: Database,
  sql: Database,
  backend: Database,
  rocket: Rocket,
  ml: Rocket,
  ai: Sparkles,
  sparkles: Sparkles,
  camera: Camera,
  photo: Camera,
  video: Camera,
  megaphone: Megaphone,
  marketing: Megaphone,
  seo: Megaphone,
  smartphone: Target,
  mobile: Target,
  chart: BarChart3,
  analytics: BarChart3,
  data: BarChart3,
  target: Target,
  exam: Target,
  test: Target,
  book: BookOpen,
  theory: BookOpen,
  course: BookOpen,
};

export function CourseTileIcon({ icon }: { icon: string }) {
  const value = (icon ?? '').trim();
  const Glyph = BY_KEYWORD[value.toLowerCase()];
  // Emoji and other single-glyph marks render as-is; a longer unknown word
  // keeps only its first two letters so it cannot overflow the tile.
  const mark = [...value].slice(0, 2).join('');

  return (
    <span className="catalog-icon" aria-hidden="true">
      {Glyph ? <Glyph size={20} /> : mark}
    </span>
  );
}
