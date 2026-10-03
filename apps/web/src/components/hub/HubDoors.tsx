'use client';

import Link from 'next/link';
import { Briefcase, CalendarDays, GraduationCap, Palette } from 'lucide-react';
import { useLanguage } from '@/context/LanguageProvider';

/**
 * The Kia Academy departments, shown on the post-auth landing (`/home`) and at
 * the top of the dashboard panel so both entry points stay identical.
 *
 * «آموزش» lands on `/tracks`, which splits it into technology and foreign
 * languages — the catalog itself is one click further down that branch.
 */
export function HubDoors({ showHeading = true }: { showHeading?: boolean }) {
  const { t } = useLanguage();

  // The academy name sits last in Persian and first in English, so the single
  // translated phrase is split around `common.brand` instead of storing the
  // halves as separate keys (which cannot express "no lead word" — the
  // translator treats an empty string as missing and falls back to English).
  const heading = t('dashboard.doors.heading');
  const brand = t('common.brand');
  const at = heading.indexOf(brand);

  return (
    <section className="dash-doors" aria-label={heading}>
      {showHeading ? (
        <h2 className="dash-doors__heading">
          {at < 0 ? (
            heading
          ) : (
            <>
              {heading.slice(0, at)}
              <span className="dash-doors__brand">{brand}</span>
              {heading.slice(at + brand.length)}
            </>
          )}
        </h2>
      ) : null}

      <div className="landing-doors landing-doors--depts">
        <Link href="/tracks" className="door tint--brand">
          <span className="door-icon" aria-hidden="true">
            <GraduationCap size={20} />
          </span>
          <h3 className="door-title">{t('dashboard.doors.educationTitle')}</h3>
          <p className="door-desc">{t('dashboard.doors.educationDesc')}</p>
        </Link>

        <Link href="/freelance" className="door tint--mint">
          <span className="door-icon" aria-hidden="true">
            <Briefcase size={20} />
          </span>
          <h3 className="door-title">{t('dashboard.doors.workTitle')}</h3>
          <p className="door-desc">{t('dashboard.doors.workDesc')}</p>
        </Link>

        <Link href="/material" className="door tint--amber">
          <span className="door-icon" aria-hidden="true">
            <Palette size={20} />
          </span>
          <h3 className="door-title">{t('dashboard.doors.materialTitle')}</h3>
          <p className="door-desc">{t('dashboard.doors.materialDesc')}</p>
        </Link>

        <Link href="/events" className="door tint--sky">
          <span className="door-icon" aria-hidden="true">
            <CalendarDays size={20} />
          </span>
          <h3 className="door-title">{t('dashboard.doors.eventsTitle')}</h3>
          <p className="door-desc">{t('dashboard.doors.eventsDesc')}</p>
        </Link>
      </div>
    </section>
  );
}