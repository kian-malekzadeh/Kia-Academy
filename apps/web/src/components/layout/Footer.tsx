'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { EnamadBadge } from '@/components/layout/EnamadBadge';
import { useLanguage } from '@/context/LanguageProvider';
import { HOME_PATH } from '@/lib/postLoginPath';

/**
 * Minimal site footer: the brand on one side, the trust/meta line on the other,
 * centred and stacked on phones. No link navigation — the top bar and the
 * learner menu own the destinations, and repeating them here only pushed the
 * trust seal off the bottom of every page. The two legal pages stay reachable
 * as plain text beside the copyright, which is all they ever were.
 */
export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Link href={HOME_PATH} className="footer-logo" aria-label={t('nav.homeAria')}>
          <BrandMark className="footer-logo-mark" size={22} title="" />
          <span className="footer-logo-text">{t('common.brand')}</span>
        </Link>

        <div className="footer-meta">
          <EnamadBadge />
          <span className="footer-status">
            <i aria-hidden="true" />
            {t('nav.footer.status')}
          </span>
          <span className="footer-legal">
            <Link href="/privacy" className="footer-legal-link">
              {t('legal.privacy.title')}
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className="footer-legal-link">
              {t('legal.terms.title')}
            </Link>
          </span>
          <span className="footer-copy">{t('nav.footer.copyright', { year })}</span>
        </div>
      </div>
    </footer>
  );
}
