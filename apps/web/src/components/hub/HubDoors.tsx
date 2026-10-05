'use client';

import Link from 'next/link';
import {
  Briefcase,
  CalendarDays,
  FlaskConical,
  GraduationCap,
  Palette,
  UsersRound,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageProvider';

/**
 * The Kia Group departments, shown on the post-auth landing (`/home`) and at
 * the top of the dashboard panel so both entry points stay identical.
 *
 * Six departments, named as one family (KIA Academy / KIA Work / KIA Material /
 * KIA Events / KIA Community / KIA Labs) so the brand reads the same in Persian
 * and English: the Persian titles transliterate the Latin ones rather than
 * inventing a second vocabulary for the same six boxes.
 *
 * Each card is just the department name: the one-line summaries they used to
 * carry («دوره‌ها، نقشه راه و بوت‌کمپ») repeated what the title already said and
 * made the tiles uneven, so they were dropped. The activity scope of each
 * department lives on the department's own page instead.
 *
 * KIA Academy lands on `/tracks`, which splits it into technology and foreign
 * languages — the catalog itself is one click further down that branch.
 * Community and Labs are new departments with a coming-soon page each, so their
 * cards are real links rather than dead ends.
 *
 * The cards are ordered by hand (UX-29), not by the registry: three columns,
 * academy · events · material on top and work · community · labs beneath.
 *
 * UX-30 gives the two rows different weights. The top row is the full-strength
 * official colour with a white glyph; the bottom row echoes the row above it,
 * each card wearing a light mix of the department directly over it — Work under
 * Academy, Community under Events, Labs under Material — with a dark glyph. The
 * borrowed hue is declared once per card as `data-tone`, which is what
 * `.door--soft[data-tone]` reads; a card's own `dept--<slug>` class stays put,
 * so its page header, its rail and its coming-soon tile are untouched.
 */
export function HubDoors({ showHeading = true }: { showHeading?: boolean }) {
  const { t } = useLanguage();

  // The group name sits last in Persian and first in English, so the single
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
        {/* Three columns, and the row order is deliberate (UX-29/30): the top
            row is academy · events · material in full strength, the soft row
            beneath is work · community · labs, each borrowing the hue of the
            card above it. The grid runs RTL, so the first card in the markup is
            the right-hand one — this sequence is also the reading order, and
            therefore the tab order. */}
        <Link href="/tracks" className="door door--strong dept--academy">
          <span className="door-icon" aria-hidden="true">
            <GraduationCap size={20} />
          </span>
          <h3 className="door-title">{t('dashboard.doors.academyTitle')}</h3>
        </Link>

        <Link href="/events" className="door door--strong dept--events">
          <span className="door-icon" aria-hidden="true">
            <CalendarDays size={20} />
          </span>
          <h3 className="door-title">{t('dashboard.doors.eventsTitle')}</h3>
        </Link>

        <Link href="/material" className="door door--strong dept--material">
          <span className="door-icon" aria-hidden="true">
            <Palette size={20} />
          </span>
          <h3 className="door-title">{t('dashboard.doors.materialTitle')}</h3>
        </Link>

        {/* Soft row — one card per column, tone borrowed from the card above. */}
        <Link href="/freelance" className="door door--soft dept--work" data-tone="academy">
          <span className="door-icon" aria-hidden="true">
            <Briefcase size={20} />
          </span>
          <h3 className="door-title">{t('dashboard.doors.workTitle')}</h3>
        </Link>

        <Link href="/community" className="door door--soft dept--community" data-tone="events">
          <span className="door-icon" aria-hidden="true">
            <UsersRound size={20} />
          </span>
          <h3 className="door-title">{t('dashboard.doors.communityTitle')}</h3>
        </Link>

        <Link href="/labs" className="door door--soft dept--labs" data-tone="material">
          <span className="door-icon" aria-hidden="true">
            <FlaskConical size={20} />
          </span>
          <h3 className="door-title">{t('dashboard.doors.labsTitle')}</h3>
        </Link>
      </div>
    </section>
  );
}