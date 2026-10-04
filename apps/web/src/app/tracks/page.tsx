'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { BookOpen, Languages } from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useLanguage } from '@/context/LanguageProvider';

/**
 * «آموزش» sub-hub — the education door splits into exactly two directions:
 * technology and foreign languages. Reached from the third door on `/home`.
 */
export default function TracksPage() {
  return (
    <RequireAuth nextPath="/tracks" learnerFlow>
      <TracksGate />
    </RequireAuth>
  );
}

function TracksGate() {
  const { t } = useLanguage();

  return (
    <div className="page-content tracks-page">
      <div className="container hub">
        <header className="page-head tracks-page__head">
          <div>
            <BrandMark className="dept-mark dept-mark--academy" size={28} title="" />
            <h1>{t('tracks.title')}</h1>
            <p>{t('tracks.sub')}</p>
          </div>
        </header>

        <div className="landing-doors landing-doors--two tracks-page__doors">
          <Link href="/tracks/technology" className="door tint--brand">
            <span className="door-icon" aria-hidden="true">
              <BookOpen size={20} />
            </span>
            <h2 className="door-title">{t('tracks.technology.title')}</h2>
            <p className="door-desc">{t('tracks.technology.desc')}</p>
            <span className="door-cta">{t('tracks.technology.cta')}</span>
          </Link>

          <Link href="/tracks/language" className="door tint--amber">
            <span className="door-icon" aria-hidden="true">
              <Languages size={20} />
            </span>
            <h2 className="door-title">{t('tracks.language.title')}</h2>
            <p className="door-desc">{t('tracks.language.desc')}</p>
            <span className="door-cta">{t('tracks.language.cta')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}