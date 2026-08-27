import { describe, expect, it } from 'vitest';
import { createFormatters } from '@/i18n/formatters';
import {
  DEFAULT_LOCALE,
  dirForLocale,
  isLocale,
  parseLocale,
  SUPPORTED_LOCALES,
} from '@/i18n/locales';
import { en, fa, messages } from '@/i18n/messages';
import { createTranslator } from '@/i18n/translate';

function collectKeys(tree: unknown, prefix = ''): string[] {
  if (!tree || typeof tree !== 'object') return [];
  return Object.entries(tree as Record<string, unknown>).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') return [path];
    return collectKeys(value, path);
  });
}

describe('i18n locales', () => {
  it('parses supported locales and falls back to default', () => {
    expect(isLocale('fa')).toBe(true);
    expect(parseLocale('en')).toBe('en');
    expect(parseLocale('nope')).toBe(DEFAULT_LOCALE);
  });

  it('marks Persian as RTL and others as LTR', () => {
    expect(dirForLocale('fa')).toBe('rtl');
    for (const locale of SUPPORTED_LOCALES) {
      if (locale === 'fa') continue;
      expect(dirForLocale(locale)).toBe('ltr');
    }
  });
});

describe('i18n dictionaries', () => {
  const enKeys = collectKeys(en);

  it('has matching key trees for every locale', () => {
    expect(collectKeys(fa).sort()).toEqual(enKeys.sort());
  });

  it('exposes every supported locale in the messages catalog', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(messages[locale]).toBeTruthy();
    }
  });
});

describe('i18n translator', () => {
  it('interpolates parameters and falls back to English', () => {
    const t = createTranslator(fa, en);
    expect(t('nav.footer.copyright', { year: 2026 })).toContain('2026');
    expect(t('missing.key')).toBe('missing.key');
  });

  it('resolves public courses catalog keys for English and Persian', () => {
    const tEn = createTranslator(en, en);
    const tFa = createTranslator(fa, en);

    expect(tEn('publicCourses.title')).toBe('Available courses');
    expect(tFa('publicCourses.title')).toBe('دوره‌های موجود');
    expect(tEn('publicCourses.viewIntro')).toBe('View introduction');
    expect(tFa('publicCourses.viewIntro')).toBe('مشاهده معرفی');
    expect(tEn('publicCourses.introEyebrow')).toBe('Course introduction');
    expect(tFa('publicCourses.introEyebrow')).toBe('معرفی دوره');
  });

  it('uses locale formatters for currency and percent', () => {
    const format = createFormatters('en');
    expect(format.currency(19)).toContain('19');
    expect(format.percent(94)).toContain('94');

    const faFormat = createFormatters('fa');
    // 1_490_000 IRR → 149_000 تومان
    expect(faFormat.currency(1_490_000)).toContain('تومان');
    expect(faFormat.currency(1_490_000)).not.toContain('ریال');
  });
});
