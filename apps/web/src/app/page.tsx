'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ClipboardCheck,
  Gauge,
  Map as MapIcon,
  PlayCircle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { EnamadBadge } from '@/components/layout/EnamadBadge';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';

const journeySteps: { key: string; Icon: ComponentType<{ size?: number }> }[] = [
  { key: 'assess', Icon: ClipboardCheck },
  { key: 'measure', Icon: Gauge },
  { key: 'roadmap', Icon: MapIcon },
  { key: 'learn', Icon: PlayCircle },
  { key: 'prove', Icon: Trophy },
];

const featureKeys = ['goal', 'readiness', 'courses', 'bootcamp'] as const;

/** Learners skip the marketing landing; staff must be able to open `/` via
 *  Admin → «بازگشت به سایت» (login already sends them to `/admin`). */
function shouldAutoEnterPanel(role?: string) {
  return role !== 'SUPER_ADMIN' && role !== 'ADMIN';
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, learnerState, loading, isAuthenticated } = useAuth();
  const registered = Boolean(user?.profileComplete || learnerState?.profileComplete);
  const autoEnterPanel =
    isAuthenticated && registered && shouldAutoEnterPanel(user?.role);

  useEffect(() => {
    if (loading || !autoEnterPanel) return;
    router.replace('/dashboard');
  }, [loading, autoEnterPanel, router]);

  if (loading || autoEnterPanel) {
    return <div className="page-content landing auth-loading" aria-busy="true" />;
  }

  return (
    <div className="page-content landing">
      {/* ---------- hero + doors (first viewport) ---------- */}
      <div className="landing-intro container">
        <header className="landing-hero">
          <span className="landing-brand">
            <BrandMark className="landing-brand-mark" title="" />
            {t('common.brand')}
          </span>

          <h1 className="landing-title">{t('landing.heroTitle')}</h1>
          <p className="landing-body">{t('landing.heroBody')}</p>

          <dl className="landing-trust">
            <div className="landing-trust-item">
              <dt>{t('landing.trust.free')}</dt>
              <dd className="text-progress">{t('landing.trust.freeValue')}</dd>
            </div>
            <div className="landing-trust-item">
              <dt>{t('landing.trust.stages')}</dt>
              <dd>{t('landing.trust.stagesValue')}</dd>
            </div>
            <div className="landing-trust-item">
              <dt>{t('landing.trust.domains')}</dt>
              <dd>{t('landing.trust.domainsValue')}</dd>
            </div>
          </dl>
        </header>

        <section className="landing-doors" aria-label={t('landing.doors.heading')}>
          <Link href="/education" className="door door--primary">
            <span className="door-top">
              <span className="chip chip--mint">{t('landing.doors.educationBadge')}</span>
            </span>
            <h2 className="door-title">{t('landing.doors.educationTitle')}</h2>
            <p className="door-desc">{t('landing.doors.educationDesc')}</p>
          </Link>

          <Link href="/material" className="door door--material">
            <span className="door-top">
              <span className="chip chip--amber">{t('landing.materialBadge')}</span>
            </span>
            <h2 className="door-title">{t('landing.doors.materialTitle')}</h2>
            <p className="door-desc">{t('landing.doors.materialDesc')}</p>
          </Link>

        </section>
        <Link href="/courses" className="landing-courses-link">
          {t('landing.doors.coursesTitle')}
          <ArrowRight className="nav-arrow" size={15} aria-hidden="true" />
        </Link>
      </div>

      {/* ---------- learner journey ---------- */}
      <section className="container landing-journey">
        <h2 className="section-heading">{t('landing.journey.heading')}</h2>
        <p className="section-sub">{t('landing.journey.sub')}</p>

        <ol className="journey-rail">
          {journeySteps.map(({ key, Icon }, index) => (
            <li key={key} className="journey-step">
              <span className="journey-index mono" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="journey-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <h3>{t(`landing.journey.${key}.title`)}</h3>
              <p>{t(`landing.journey.${key}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- what you get ---------- */}
      <section className="container features-section">
        <h2 className="section-heading">{t('landing.howHeading')}</h2>
        <p className="section-sub">{t('landing.howSub')}</p>

        <div className="features-grid">
          {featureKeys.map((key, index) => (
            <article key={key} className="feature-card">
              <span
                className={`feature-icon${index % 3 === 1 ? ' feature-icon--mint' : ''}${
                  index % 3 === 2 ? ' feature-icon--amber' : ''
                }`}
                aria-hidden="true"
              >
                <Sparkles size={20} />
              </span>
              <h3>{t(`landing.feature.${key}.title`)}</h3>
              <p>{t(`landing.feature.${key}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- closing call ---------- */}
      <section className="container-fluid landing-close">
        <div className="landing-close-panel surface--ink">
          <h2>{t('landing.journey.heading')}</h2>
          <p>{t('landing.trust.note')}</p>
          <div className="hero-actions">
            <Link href="/education" className="btn btn--accent btn--lg hero-cta">
              {t('landing.ctaAssessment')}
              <ArrowRight className="nav-arrow" size={18} aria-hidden="true" />
            </Link>
            <Link href="/material" className="btn btn--ghost landing-close-ghost hero-cta">
              {t('landing.ctaMaterial')}
            </Link>
          </div>
        </div>
      </section>

      <footer className="container landing-guest-footer" aria-label={t('nav.footer.legal')}>
        <span className="landing-guest-brand">{t('common.brand')}</span>
        <nav>
          <Link href="/contact">{t('landing.ctaContact')}</Link>
          <Link href="/privacy">{t('nav.footer.privacy')}</Link>
          <Link href="/terms">{t('nav.footer.terms')}</Link>
          <Link href="/login">{t('landing.ctaSignIn')}</Link>
        </nav>
        <EnamadBadge className="landing-enamad" />
      </footer>
    </div>
  );
}
