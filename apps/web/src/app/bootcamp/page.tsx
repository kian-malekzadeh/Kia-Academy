'use client';

import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { ChallengeCard } from '@/components/bootcamp/ChallengeCard';
import { Leaderboard } from '@/components/bootcamp/Leaderboard';
import { useLanguage } from '@/context/LanguageProvider';

const CARD_TIMER_SECONDS = 2 * 3600 + 14 * 60 + 8;

export default function BootcampPage() {
  const router = useRouter();
  const { t, format } = useLanguage();

  return (
    <RequireAuth nextPath="/bootcamp">
      <div className="page-content">
        <div className="container dash">
          <PageBackButton href="/dashboard" label={t('bootcamp.backDashboard')} />
          <div className="dash-head">
            <div>
              <h1>{t('bootcamp.title')}</h1>
              <p>{t('bootcamp.sub')}</p>
            </div>
            <div className="rank-card">
              <div className="rk-num">#12</div>
              <div className="rk-label">
                {t('bootcamp.rankLabel', { points: format.number(340) })}
              </div>
            </div>
          </div>
          <div className="section-title">{t('bootcamp.activeChallenges')}</div>
          <div className="challenge-row">
            <ChallengeCard
              title={t('bootcamp.challenge.fizzbuzz.title')}
              description={t('bootcamp.challenge.fizzbuzz.desc')}
              badge={t('bootcamp.challenge.fizzbuzz.badge')}
              points={t('bootcamp.challenge.fizzbuzz.points')}
              footerLeft={t('bootcamp.challenge.fizzbuzz.footer')}
              initialSeconds={CARD_TIMER_SECONDS}
              onClick={() => router.push('/bootcamp/challenge')}
            />
            <ChallengeCard
              title={t('bootcamp.challenge.palindrome.title')}
              description={t('bootcamp.challenge.palindrome.desc')}
              badge={t('bootcamp.challenge.palindrome.badge')}
              badgeMuted
              points={t('bootcamp.challenge.palindrome.points')}
              footerLeft={t('bootcamp.challenge.palindrome.footer')}
              disabled
            />
          </div>
          <div className="section-title">{t('bootcamp.leaderboard')}</div>
          <Leaderboard />
        </div>
      </div>
    </RequireAuth>
  );
}
