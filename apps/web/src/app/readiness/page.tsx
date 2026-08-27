'use client';

import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useApp } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';

export default function ReadinessGatePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { resetReadinessTest, testCompleted, roadmap } = useApp();
  const { loading, isAuthenticated } = useAuth();

  const startTest = () => {
    if (!isAuthenticated) {
      router.push('/education?next=/readiness/test');
      return;
    }
    resetReadinessTest();
    router.push('/readiness/test');
  };

  const goResults = () => router.push('/readiness/results');
  const goRoadmap = () =>
    router.push(
      roadmap?.id ? `/roadmap?roadmapId=${encodeURIComponent(roadmap.id)}` : '/roadmap',
    );

  return (
    <div className="page-content">
      <div className="container gate exam-gate">
        <PageBackButton href="/assessment" label={t('readiness.gate.backAssessment')} />
        <span className="eyebrow amber">{t('exam.gate.eyebrow')}</span>
        <h1>{t('exam.gate.title')}</h1>
        <p className="desc">{t('exam.gate.desc')}</p>
        <div className="cover-grid">
          <div className="cover-card">
            <span className="ci">🗂️</span>
            <b>{t('exam.domains.digitalOps')}</b>
            <span>{t('exam.gate.digitalOps')}</span>
          </div>
          <div className="cover-card">
            <span className="ci">🧠</span>
            <b>{t('exam.domains.logicalReasoning')}</b>
            <span>{t('exam.gate.logicalReasoning')}</span>
          </div>
          <div className="cover-card">
            <span className="ci">📖</span>
            <b>{t('exam.domains.techReading')}</b>
            <span>{t('exam.gate.techReading')}</span>
          </div>
          <div className="cover-card">
            <span className="ci">💻</span>
            <b>{t('exam.domains.codeSense')}</b>
            <span>{t('exam.gate.codeSense')}</span>
          </div>
          <div className="cover-card">
            <span className="ci">🧩</span>
            <b>{t('exam.domains.problemSolving')}</b>
            <span>{t('exam.gate.problemSolving')}</span>
          </div>
        </div>
        <div className="gate-footer">
          <div className="price-tag">
            {t('readiness.gate.priceFree')}
            <span>{t('exam.gate.meta')}</span>
          </div>
          {loading ? (
            <button type="button" className="cta-primary" disabled>
              <Loader2 size={18} className="spin" /> {t('readiness.gate.loading')}
            </button>
          ) : testCompleted ? (
            <div className="gate-actions">
              <button type="button" className="cta-primary" onClick={goResults}>
                {t('readiness.gate.viewResults')}
              </button>
              <button type="button" className="cta-secondary" onClick={goRoadmap}>
                {t('readiness.gate.viewRoadmap')}
              </button>
              <button type="button" className="cta-secondary" onClick={startTest}>
                {t('exam.gate.retake')}
              </button>
            </div>
          ) : (
            <button type="button" className="cta-primary" onClick={startTest}>
              {t('exam.gate.start')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
