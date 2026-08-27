'use client';

import { buildEnamadBadgeUrls } from '@kia-academy/shared';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/context/LanguageProvider';

/**
 * Enamad trust seal — built from admin-configured id/code only (no raw HTML injection).
 */
export function EnamadBadge({ className }: { className?: string }) {
  const { settings, loading } = useSiteSettings();
  const { t } = useLanguage();
  if (loading) return null;

  const urls = buildEnamadBadgeUrls(settings.enamad);
  if (!urls) return null;

  return (
    <a
      className={className ? `enamad-badge ${className}` : 'enamad-badge'}
      href={urls.href}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="origin"
      aria-label={t('nav.footer.enamad')}
    >
      {/* External trustseal host — plain img is intentional. */}
      <img
        src={urls.imgSrc}
        alt={t('nav.footer.enamad')}
        width={125}
        height={136}
        referrerPolicy="origin"
        style={{ cursor: 'pointer', maxWidth: 80, height: 'auto' }}
      />
    </a>
  );
}
