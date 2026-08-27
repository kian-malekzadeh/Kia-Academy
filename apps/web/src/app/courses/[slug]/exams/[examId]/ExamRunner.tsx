'use client';

import type { CourseExamAttemptSession, CourseExamSubmitResult } from '@kia-academy/shared';
import { CheckCircle2, Loader2, Timer, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

type ExamAnswer =
  | { type: 'single_choice'; optionId: string }
  | { type: 'multi_choice'; optionIds: string[] };
type ExamAnswers = Record<string, ExamAnswer>;

export default function CourseExamRunner() {
  const { slug, examId } = useParams<{ slug: string; examId: string }>();
  const { t } = useLanguage();
  const [session, setSession] = useState<CourseExamAttemptSession | null>(null);
  const [answers, setAnswers] = useState<ExamAnswers>({});
  const [result, setResult] = useState<CourseExamSubmitResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [now, setNow] = useState(() => Date.now());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .startCourseExam(examId)
      .then((s) => {
        if (!alive) return;
        setSession(s);
        setAnswers(s.savedAnswers);
      })
      .catch((err) => {
        if (alive) setError(err instanceof ApiError ? err.message : t('courses.runner.loadError'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [examId, t]);

  useEffect(() => {
    if (!session || session.status !== 'IN_PROGRESS') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  const remainingSec = useMemo(() => {
    if (!session) return 0;
    return Math.max(0, Math.floor((Date.parse(session.endsAt) - now) / 1000));
  }, [session, now]);
  const expired = !session || session.status === 'EXPIRED' || remainingSec <= 0;

  const queueSave = useCallback(
    (next: ExamAnswers) => {
      if (!session || session.status !== 'IN_PROGRESS') return;
      setSaveState('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        api
          .saveCourseExamAnswers(examId, session.attemptId, next)
          .then(() => setSaveState('saved'))
          .catch(() => setSaveState('idle'));
      }, 700);
    },
    [session, examId],
  );

  const setSingle = (qId: string, optionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [qId]: { type: 'single_choice', optionId } as const };
      queueSave(next);
      return next;
    });
  };

  const toggleMulti = (qId: string, optionId: string) => {
    setAnswers((prev) => {
      const cur = prev[qId];
      const ids = cur?.type === 'multi_choice' ? cur.optionIds : [];
      const optionIds = ids.includes(optionId)
        ? ids.filter((x) => x !== optionId)
        : [...ids, optionId];
      const next = { ...prev, [qId]: { type: 'multi_choice', optionIds } as const };
      queueSave(next);
      return next;
    });
  };

  const submit = async () => {
    if (!session) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.submitCourseExam(examId, session.attemptId, answers);
      setResult(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('courses.runner.loadError'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content auth-loading">
        <Loader2 size={24} className="spin" />
      </div>
    );
  }
  if (error || !session) {
    return (
      <div className="page-content">
        <div className="container auth-shell">
          <PageBackButton href={`/courses/${slug}`} />
          <p className="form-error">{error || t('courses.runner.loadError')}</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="page-content">
        <div className="container auth-shell">
          <PageBackButton href={`/courses/${slug}`} />
          <h1>{t('courses.runner.resultTitle')}</h1>
          <p className="auth-sub">{session.examTitle}</p>
          <div className="catalog-card" style={{ maxWidth: 640 }}>
            {result.passed ? (
              <p className="form-success">
                <CheckCircle2 size={16} className="inline-leading-icon" /> {t('courses.runner.passed')}
              </p>
            ) : (
              <p className="form-error">
                <XCircle size={16} className="inline-leading-icon" /> {t('courses.runner.failed')}
              </p>
            )}
            <div className="catalog-meta">
              <span>
                {t('courses.runner.scoreLabel')}: {result.score}%
              </span>
              <span>
                {t('courses.runner.passScoreLabel')}: {result.passScore}%
              </span>
              <span>
                {t('courses.runner.correctCount', {
                  correct: result.correctCount,
                  total: result.totalCount,
                })}
              </span>
            </div>
            <div className="catalog-actions">
              <Link href={`/courses/${slug}`} className="btn btn--primary">
                {t('courses.runner.back')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const ss = String(remainingSec % 60).padStart(2, '0');

  return (
    <div className="page-content">
      <div className="container auth-shell">
        <PageBackButton href={`/courses/${slug}`} />
        <h1>{session.examTitle}</h1>
        <div className="catalog-meta" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>
            <Timer size={14} className="inline-leading-icon" /> {t('courses.runner.timeLeft')}:{' '}
            <strong dir="ltr">
              {mm}:{ss}
            </strong>
          </span>
          <span>
            {saveState === 'saving'
              ? t('courses.runner.saving')
              : saveState === 'saved'
                ? t('courses.runner.saved')
                : ''}
          </span>
        </div>
        {expired ? <p className="form-error">{t('courses.runner.expiredBanner')}</p> : null}
        <div className="lesson-nav">
          {session.questions.map((q, idx) => {
            const picked = answers[q.id];
            return (
              <div
                key={q.id}
                className="lesson-nav-item"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}
              >
                <strong>{t('courses.runner.question', { n: idx + 1, total: session.questions.length })}</strong>
                <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{q.prompt}</p>
                <span className="lesson-nav-meta">
                  {q.type === 'multi_choice'
                    ? t('courses.runner.multiHint')
                    : t('courses.runner.singleHint')}
                </span>
                {q.options.map((opt) => {
                  const checked =
                    q.type === 'single_choice'
                      ? picked?.type === 'single_choice' && picked.optionId === opt.id
                      : picked?.type === 'multi_choice' && picked.optionIds.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <input
                        type={q.type === 'single_choice' ? 'radio' : 'checkbox'}
                        name={`q-${q.id}`}
                        checked={checked}
                        onChange={() =>
                          q.type === 'single_choice'
                            ? setSingle(q.id, opt.id)
                            : toggleMulti(q.id, opt.id)
                        }
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="catalog-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn--primary" onClick={() => void submit()} disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : null} {t('courses.runner.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}