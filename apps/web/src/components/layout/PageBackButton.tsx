'use client';

import { ArrowLeft } from 'lucide-react';
import { BackLink } from '@/components/layout/BackLink';
import { useLanguage } from '@/context/LanguageProvider';

interface PageBackButtonProps {
  /** Fallback target, used only when the page has no in-app history behind it. */
  href: string;
  /** `admin` re-skins the pill for the dark admin shell; the slot is identical. */
  variant?: 'default' | 'admin';
}

/**
 * The one back control of the whole product: same pill, same label («بازگشت»),
 * same slot. It is rendered by the page shells — `SiteChrome` for learner and
 * public pages, the admin shell for `/admin` — so no page can place or word it
 * differently. Pages must not render a back control of their own.
 */
export function PageBackButton({ href, variant = 'default' }: PageBackButtonProps) {
  const { t } = useLanguage();
  return (
    <div className={`page-back-wrap page-back-wrap--${variant}`}>
      <BackLink href={href} className="page-back-btn">
        <ArrowLeft size={16} className="nav-arrow" aria-hidden />
        <span>{t('common.back')}</span>
      </BackLink>
    </div>
  );
}
