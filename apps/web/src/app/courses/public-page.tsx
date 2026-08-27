'use client';

import type { CourseSummary } from '@kia-academy/shared';
import { BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import { localizeCourse } from '@/lib/courseLocalization';

export function PublicCoursesPage() {
  const { t, locale } = useLanguage();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listCourses()
      .then(setCourses)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('courses.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  const localizedCourses = useMemo(
    () => courses.map((course) => localizeCourse(course, locale)),
    [courses, locale],
  );

  if (loading) {
    return <div className="page-content auth-loading"><Loader2 size={24} className="spin" /> {t('courses.loading')}</div>;
  }

  return (
    <div className="page-content">
      <div className="container catalog-shell">
        <PageBackButton href="/" />
        <span className="eyebrow"><BookOpen size={14} className="inline-leading-icon" />{t('publicCourses.eyebrow')}</span>
        <h1>{t('publicCourses.title')}</h1>
        <p className="auth-sub">{t('publicCourses.sub')}</p>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="catalog-grid">
          {localizedCourses.map((course) => (
            <article key={course.id} className="catalog-card">
              <span className="catalog-icon">{course.icon}</span>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="catalog-meta">
                <span>{t('common.lessonsCount', { count: course.lessonCount })}</span>
                <span>{course.enrolled ? t('courses.status.unlocked') : t('publicCourses.available')}</span>
              </div>
              <div className="catalog-actions">
                <Link href={`/courses/${course.slug}`} className="btn btn--primary">{t('publicCourses.viewIntro')}</Link>
              </div>
            </article>
          ))}
        </div>
        {!error && localizedCourses.length === 0 ? <p className="auth-sub">{t('courses.empty')}</p> : null}
      </div>
    </div>
  );
}
