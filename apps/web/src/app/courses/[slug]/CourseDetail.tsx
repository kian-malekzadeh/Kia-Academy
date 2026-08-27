'use client';

import type { CourseExamSummary, CourseSummary, LessonSummary } from '@kia-academy/shared';
import { BookOpen, Loader2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useAuth } from '@/context/AuthProvider';
import { useCart } from '@/context/CartProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import { localizeCourse, localizeLesson } from '@/lib/courseLocalization';

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { addCourse } = useCart();
  const [course, setCourse] = useState<(CourseSummary & { lessons: LessonSummary[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartBusy, setCartBusy] = useState(false);
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    if (!slug) return;
    api
      .getCourse(slug)
      .then(setCourse)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('courses.loadError')))
      .finally(() => setLoading(false));
  }, [slug, t]);

  const localizedCourse = useMemo(() => course && localizeCourse(course, locale), [course, locale]);

  const [exams, setExams] = useState<CourseExamSummary[]>([]);
  useEffect(() => {
    if (!slug || !course?.enrolled) return;
    api
      .listCourseExamsForLearner(slug)
      .then(setExams)
      .catch(() => setExams([]));
  }, [slug, course?.enrolled]);

  const lessons = useMemo(
    () => course?.lessons.map((lesson) => localizeLesson(lesson, slug, locale)) ?? [],
    [course, locale, slug],
  );

  // Resume at the next lesson after the last completed one; fall back to the first.
  const resumeLesson = useMemo(
    () => lessons.find((lesson) => !lesson.completed) ?? lessons[0],
    [lessons],
  );

  if (loading) {
    return (
      <div className="page-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('courses.loading')}
      </div>
    );
  }
  if (error || !localizedCourse) {
    return (
      <div className="page-content">
        <div className="container auth-shell">
          <PageBackButton href="/courses" />
          <p className="form-error">{error || t('courses.loadError')}</p>
        </div>
      </div>
    );
  }

  const checkout = `/checkout?product=COURSE&slugs=${encodeURIComponent(localizedCourse.slug)}`;
  const buyNowHref = isAuthenticated ? checkout : `/login?next=${encodeURIComponent(checkout)}`;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/courses/${localizedCourse.slug}`)}`);
      return;
    }
    setCartBusy(true);
    setCartMsg('');
    try {
      await addCourse(localizedCourse.slug);
      setCartMsg(t('cart.added'));
      router.push('/cart');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const msg = err.message.toLowerCase();
        if (msg.includes('purchased') || msg.includes('owned')) {
          setCartMsg(t('cart.alreadyOwned'));
        } else {
          setCartMsg(t('cart.alreadyInCart'));
          router.push('/cart');
        }
      } else {
        setError(err instanceof ApiError ? err.message : t('cart.addError'));
      }
    } finally {
      setCartBusy(false);
    }
  };

  return (
    <div className="page-content">
      <div className="container catalog-shell">
        <PageBackButton href="/courses" />
        <span className="eyebrow">
          <BookOpen size={14} className="inline-leading-icon" />
          {t('publicCourses.introEyebrow')}
        </span>
        <h1>{localizedCourse.title}</h1>
        <p className="auth-sub">{localizedCourse.description}</p>
        <div className="catalog-card" style={{ maxWidth: 760 }}>
          <div className="catalog-meta">
            <span>{t('common.lessonsCount', { count: localizedCourse.lessonCount })}</span>
            <span>{t('publicCourses.sessionsLocked')}</span>
          </div>
          <h3>{t('publicCourses.previewTitle')}</h3>
          <div className="lesson-nav">
            {lessons.slice(0, 3).map((lesson) => (
              <span key={lesson.id} className="lesson-nav-item">
                <span className="lesson-nav-title">{lesson.title}</span>
                <span className="lesson-nav-meta">
                  {t('common.durationMin', { min: lesson.durationMin })}
                </span>
              </span>
            ))}
          </div>
          <p>{t('publicCourses.introBody')}</p>
          {exams.length > 0 ? (
            <div style={{ marginTop: '1.25rem' }}>
              <h3>{t('courses.exams')}</h3>
              <div className="lesson-nav">
                {exams.map((exam) => (
                  <Link
                    key={exam.id}
                    href={`/courses/${localizedCourse.slug}/exams/${exam.id}`}
                    className="lesson-nav-item"
                  >
                    <span className="lesson-nav-title">
                      {exam.title}
                      <span className="lesson-nav-meta" style={{ marginInlineStart: '0.5rem' }}>
                        [
                        {exam.kind === 'MIDTERM'
                          ? t('courses.examKindMidterm')
                          : t('courses.examKindFinal')}
                        ]
                      </span>
                    </span>
                    <span className="lesson-nav-meta">
                      {t('courses.examQuestions', { count: exam.questionCount })} ·{' '}
                      {t('courses.examDuration', { min: exam.durationMin })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {cartMsg ? <p className="form-success">{cartMsg}</p> : null}
          <div className="catalog-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {localizedCourse.enrolled && lessons.length > 0 ? (
              <Link
                href={`/learn/${localizedCourse.slug}/${resumeLesson?.slug ?? ''}`}
                className="btn btn--primary"
              >
                {t('courses.continue')}
              </Link>
            ) : !localizedCourse.enrolled ? (
              <>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => void handleAddToCart()}
                  disabled={cartBusy}
                >
                  {cartBusy ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <ShoppingCart size={16} />
                  )}{' '}
                  {t('cart.add')}
                </button>
                <Link href={buyNowHref} className="btn btn--ghost">
                  {t('publicCourses.buy')}
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
