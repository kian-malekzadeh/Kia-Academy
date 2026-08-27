'use client';

import { useEffect, useRef, useState } from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/context/LanguageProvider';
import { LOCALE_OPTIONS, type Locale } from '@/i18n/locales';

export function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const current = LOCALE_OPTIONS.find((o) => o.code === locale) ?? LOCALE_OPTIONS[0]!;

  const select = (code: Locale) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div className="lang-selector" ref={ref}>
      <button
        type="button"
        className="theme-toggle lang-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('language.label')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Languages size={14} aria-hidden="true" />
        <span className="lang-code">{current.code.toUpperCase()}</span>
        <span
          className="lang-label"
          lang={current.code}
          dir={current.code === 'fa' ? 'rtl' : 'ltr'}
        >
          {current.nativeLabel}
        </span>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={t('language.label')}>
          {LOCALE_OPTIONS.map((opt) => (
            <li key={opt.code} role="option" aria-selected={opt.code === locale}>
              <button
                type="button"
                className={opt.code === locale ? 'active' : undefined}
                onClick={() => select(opt.code)}
              >
                <span className="lang-code">{opt.code.toUpperCase()}</span>
                <span lang={opt.code} dir={opt.code === 'fa' ? 'rtl' : 'ltr'}>
                  {opt.nativeLabel}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
