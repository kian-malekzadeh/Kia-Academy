'use client';

import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { LessonDetail, LessonSummary } from '@kia-academy/shared';
import { parseLessonContent } from '@kia-academy/shared';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { LessonPlayground } from '@/components/lesson/LessonPlayground';
import { LessonVideo } from '@/components/lesson/LessonVideo';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import { markdownToHtml } from '@/lib/markdown';
import { mediaUrl } from '@/lib/mediaUrl';

export default function LessonPlayerPage() {
  const params = useParams<{ courseSlug: string; lessonSlug: string }>();
  const courseSlug = params.courseSlug;
  const lessonSlug = params.lessonSlug;
  const nextPath =
    courseSlug && lessonSlug ? `/learn/${courseSlug}/${lessonSlug}` : '/courses';

  return (
    <RequireAuth nextPath={nextPath} learnerFlow>
      <LessonPlayerContent courseSlug={courseSlug} lessonSlug={lessonSlug} />
    </RequireAuth>
  );
}

function LessonPlayerContent({
  courseSlug,
  lessonSlug,
}: {
  courseSlug: string;
  lessonSlug: string;
}) {
  const router = useRouter();
  const { t, format } = useLanguage();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [note, setNote] = useState('');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!courseSlug || !lessonSlug) return;
    setLoading(true);
    const noteKey = `kia-lesson-note:${courseSlug}:${lessonSlug}`;
    setNote(typeof window !== 'undefined' ? (localStorage.getItem(noteKey) ?? '') : '');

    Promise.all([api.getLesson(courseSlug, lessonSlug), api.getCourse(courseSlug)])
      .then(([lessonDetail, course]) => {
        setLesson(lessonDetail);
        setLessons(course.lessons ?? []);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : t('lesson.loadError'));
      })
      .finally(() => setLoading(false));
  }, [courseSlug, lessonSlug, t]);

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter((item) => item.title.toLowerCase().includes(q));
  }, [lessons, query]);

  const parsedContent = useMemo(
    () => (lesson ? parseLessonContent(lesson.content) : null),
    [lesson],
  );

  const progressPct = useMemo(() => {
    if (!lessons.length) return 0;
    const done = lessons.filter((item) => item.completed).length;
    return Math.round((done / lessons.length) * 100);
  }, [lessons]);

  const markComplete = async () => {
    if (!courseSlug || !lessonSlug) return;
    setCompleting(true);
    try {
      await api.completeLesson(courseSlug, lessonSlug);
      setLesson((prev) => (prev ? { ...prev, completed: true } : prev));
      setLessons((prev) =>
        prev.map((item) => (item.slug === lessonSlug ? { ...item, completed: true } : item)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('lesson.completeError'));
    } finally {
      setCompleting(false);
    }
  };

  const saveNote = (value: string) => {
    setNote(value);
    if (courseSlug && lessonSlug) {
      localStorage.setItem(`kia-lesson-note:${courseSlug}:${lessonSlug}`, value);
    }
  };

  const copyNote = async () => {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable in some environments.
    }
  };

  if (loading) {
    return (
      <div className="page-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('lesson.loading')}
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="page-content">
        <div className="container lesson-shell kia-lesson-shell">
          <p className="form-error">{error || t('lesson.notFound')}</p>
          <Link href="/courses" className="back-link">
            {t('lesson.backToCourses')}
          </Link>
        </div>
      </div>
    );
  }

  const videoSrc = lesson.videoUrl ? mediaUrl(lesson.videoUrl) : null;

  return (
    <div className="page-content">
      <div className="container lesson-shell kia-lesson-shell">
        <div className="learn-layout">
          <aside className="learn-sidebar glass-panel" aria-label={t('lesson.lessonsNav')}>
            <div className="sidebar-head">
              <h2 className="learn-brand">{lesson.courseTitle}</h2>
              <p className="muted">{t('lesson.sidebarBrand')}</p>
            </div>

            <label className="field-label" htmlFor="lesson-search">
              {t('lesson.searchLessons')}
            </label>
            <input
              id="lesson-search"
              className="input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('lesson.searchPlaceholder')}
            />

            <div className="learn-progress">
              <div className="learn-progress-label">
                <span>{t('lesson.progressLabel')}</span>
                <strong>{progressPct}%</strong>
              </div>
              <div className="progress-bar" aria-hidden="true">
                <span style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <nav className="lesson-nav" aria-label={t('lesson.lessonsNav')}>
              {filteredLessons.map((item) => (
                <Link
                  key={item.id}
                  href={`/learn/${courseSlug}/${item.slug}`}
                  className={`lesson-nav-item${item.slug === lessonSlug ? ' active' : ''}${item.completed ? ' done' : ''}`}
                >
                  <span className="lesson-nav-title">{item.title}</span>
                  <span className="lesson-nav-meta">
                    {t('lesson.duration', { minutes: item.durationMin })}
                    {item.completed ? ` · ${t('lesson.completed')}` : ''}
                  </span>
                </Link>
              ))}
            </nav>
          </aside>

          <section className="learn-main">
            <article className="lesson-content-card glass-panel">
              <div className="lesson-top-row">
                <div>
                  <PageBackButton href="/courses" label={t('lesson.backToCourses')} />
                  <h1>{lesson.title}</h1>
                  <div className="lesson-meta">
                    <span className="meta-chip">{format.durationMinutes(lesson.durationMin)}</span>
                    {lesson.completed && (
                      <span className="meta-chip meta-chip--done">
                        <CheckCircle size={14} /> {t('lesson.completed')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <LessonVideo src={videoSrc} title={lesson.title} />

              <div
                className="lesson-description lesson-md"
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(parsedContent?.markdown ?? lesson.content),
                }}
              />

              <div className="lesson-actions-row">
                {lesson.prevSlug ? (
                  <button
                    type="button"
                    className="pill-btn"
                    onClick={() => router.push(`/learn/${courseSlug}/${lesson.prevSlug}`)}
                  >
                    <ArrowLeft size={16} className="nav-arrow" aria-hidden /> {t('lesson.previous')}
                  </button>
                ) : null}
                {lesson.nextSlug ? (
                  <button
                    type="button"
                    className="pill-btn"
                    onClick={() => router.push(`/learn/${courseSlug}/${lesson.nextSlug}`)}
                  >
                    {t('lesson.next')} <ArrowRight size={16} className="nav-arrow" aria-hidden />
                  </button>
                ) : (
                  <Link href="/courses" className="pill-btn">
                    {t('lesson.allLessons')}
                  </Link>
                )}
                {!lesson.completed && (
                  <button
                    type="button"
                    className="pill-btn pill-btn--primary"
                    onClick={markComplete}
                    disabled={completing}
                  >
                    {completing ? t('lesson.saving') : t('lesson.markComplete')}
                  </button>
                )}
              </div>
            </article>

            <section className="learn-utility-grid">
              <article className="notes-card glass-panel">
                <div className="lesson-top-row">
                  <div>
                    <h3>{t('lesson.notesTitle')}</h3>
                    <p className="muted">{t('lesson.notesHint')}</p>
                  </div>
                  <button type="button" className="pill-btn" onClick={() => void copyNote()}>
                    {copied ? t('lesson.notesCopied') : t('lesson.notesCopy')}
                  </button>
                </div>
                <textarea
                  className="note-editor"
                  value={note}
                  onChange={(e) => saveNote(e.target.value)}
                  rows={6}
                  placeholder={t('lesson.notesHint')}
                />
              </article>

              <LessonPlayground
                storageKey={`kia-lesson-code:${courseSlug}:${lessonSlug}`}
                starterHtml={parsedContent?.playground?.html}
                starterCss={parsedContent?.playground?.css}
                starterJs={parsedContent?.playground?.js}
              />
            </section>
          </section>
        </div>
      </div>
    </div>
  );
}
