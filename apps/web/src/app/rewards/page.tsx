'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useApp } from '@/context/AppProvider';
import { useLanguage } from '@/context/LanguageProvider';

function translateCourseStatus(status: string, t: (key: string) => string): string {
  if (status === 'In progress') return t('domain.courseStatuses.inProgress');
  if (status === 'Unlocked') return t('domain.courseStatuses.unlocked');
  if (status === 'Completed') return t('domain.courseStatuses.completed');
  return status;
}

export default function RewardsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { interviewUnlocked, courses } = useApp();

  return (
    <RequireAuth nextPath="/rewards">
      <div className="page-content">
        <div className="container rewards">
          <PageBackButton href="/dashboard" />
          <h2>{t('rewards.title')}</h2>
          <p className="sub">{t('rewards.sub')}</p>
          <div className="reward-grid">
            <div className="reward-card unlocked">
              <span className="rw-tag unlocked">{t('rewards.unlocked')}</span>
              <span className="rw-icon">🥇</span>
              <b>{t('rewards.top3.title')}</b>
              <span>{t('rewards.top3.desc')}</span>
            </div>
            <div className={`reward-card${interviewUnlocked ? ' unlocked' : ''}`}>
              <span className={`rw-tag ${interviewUnlocked ? 'unlocked' : 'locked'}`}>
                {interviewUnlocked ? t('rewards.unlocked') : t('rewards.locked')}
              </span>
              <span className="rw-icon">🎤</span>
              <b>{t('rewards.interview.title')}</b>
              <span>{t('rewards.interview.desc')}</span>
              {interviewUnlocked && (
                <Link href="/learn/interview-branding/portfolio-story" className="reward-link">
                  {t('rewards.interview.open')}
                </Link>
              )}
            </div>
            <div className="reward-card">
              <span className="rw-tag locked">{t('rewards.locked')}</span>
              <span className="rw-icon">🌟</span>
              <b>{t('rewards.mentor.title')}</b>
              <span>{t('rewards.mentor.desc')}</span>
            </div>
          </div>
          <div className="section-title">{t('rewards.myCourses')}</div>
          <div className="courses-list">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={
                  course.id === 'interview'
                    ? '/learn/interview-branding/portfolio-story'
                    : '/courses'
                }
                className={`course-row${course.isNew ? ' new' : ''}`}
              >
                <span className="cr-icon">{course.icon}</span>
                <span className="cr-name">
                  {course.id === 'interview' ? t('courses.interview.name') : course.name}
                </span>
                <span className="cr-status">
                  {translateCourseStatus(course.status, t)}{' '}
                  <span className="nav-arrow" aria-hidden>
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <div className="unlock-cta">
            <div>
              <h5>{t('rewards.cta.title')}</h5>
              <p>{t('rewards.cta.sub')}</p>
            </div>
            <button type="button" className="cta-primary" onClick={() => router.push('/dashboard')}>
              {t('rewards.cta.button')}
            </button>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
