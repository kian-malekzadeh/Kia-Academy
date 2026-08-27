export const SUPPORTED_LOCALES = ['en', 'fa'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fa';

export const RTL_LOCALES = new Set<Locale>(['fa']);

/** Bumped so stale English auto-detect cookies from earlier builds are ignored. */
export const LOCALE_COOKIE = 'kia-academy-locale';

export interface LocaleOption {
  code: Locale;
  label: string;
  nativeLabel: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'fa', label: 'Persian', nativeLabel: 'فارسی' },
];

export function isLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function parseLocale(value: string | null | undefined): Locale {
  if (isLocale(value)) return value;
  return DEFAULT_LOCALE;
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('fa') || lang.startsWith('pe')) return 'fa';
  if (lang.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

export function dirForLocale(locale: Locale): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}
