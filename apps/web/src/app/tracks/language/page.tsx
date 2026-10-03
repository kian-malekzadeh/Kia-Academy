'use client';

import Link from 'next/link';
import { Clock, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageProvider';

/**
 * Foreign languages — the second «آموزش» direction. No language content
 * exists in the catalog yet, so this is an honest landing page: what is
 * coming, and a way to be told when it lands.
 */
export default function LanguageTracksPage() {
  const { t } = useLanguage();

  return (
    <div className="page-content tracks-page">
      <div className="container hub">
        <header className="page-head tracks-page__head">
          <div>
            <span className="eyebrow amber">
              <Clock size={14} className="inline-leading-icon" />
              {t('tracks.language.badge')}
            </span>
            <h1>{t('tracks.language.title')}</h1>
            <p>{t('tracks.language.sub')}</p>
          </div>
        </header>

        <div className="bento tracks-language__bento">
          <div className="tile tile--half tile--feature">
            <span className="t-icon t-icon--brand" aria-hidden="true">
              <Clock size={22} />
            </span>
            <b>{t('tracks.language.planning.title')}</b>
            <span>{t('tracks.language.planning.body')}</span>
            <span className="t-status t-status--brand">{t('tracks.language.planning.status')}</span>
          </div>

          <div className="tile tile--half">
            <span className="t-icon" aria-hidden="true">
              <MessageSquare size={22} />
            </span>
            <b>{t('tracks.language.tellUs.title')}</b>
            <span>{t('tracks.language.tellUs.body')}</span>
            <span className="t-status">{t('tracks.language.tellUs.status')}</span>
          </div>
        </div>

        <div className="hub-actions">
          <Link href="/contact" className="btn btn--primary btn--lg">
            {t('tracks.language.tellUs.cta')}
          </Link>
          <Link href="/courses" className="btn btn--ghost btn--lg">
            {t('tracks.language.alternative')}
          </Link>
        </div>
      </div>
    </div>
  );
}