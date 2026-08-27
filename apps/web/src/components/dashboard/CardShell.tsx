'use client';

import { AlertCircle, RotateCcw, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

export function CardShell({
  title,
  icon: Icon,
  cta,
  isLoading,
  error,
  onRetry,
  span,
  children,
}: {
  title: string;
  icon: LucideIcon;
  cta?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  span?: 'full' | 2;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <section
      className={`dash-card card-hover anim-fade-up${span === 'full' ? ' dash-card--full' : ''}${span === 2 ? ' dash-card--span-2' : ''}`}
    >
      <header className="dash-card__head">
        <div className="dash-card__title">
          <Icon size={16} aria-hidden="true" />
          <span>{title}</span>
        </div>
        {cta}
      </header>
      <div className="dash-card__body">
        {isLoading ? <SkeletonLines /> : null}
        {!isLoading && error ? (
          <div className="dash-card__error">
            <AlertCircle size={16} aria-hidden="true" />
            <div>
              <p>{error}</p>
              {onRetry ? (
                <button type="button" className="dash-btn-ghost" onClick={onRetry}>
                  <RotateCcw size={13} aria-hidden="true" />
                  {t('dashboard.error.retry')}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {!isLoading && !error ? children : null}
      </div>
    </section>
  );
}

export function SkeletonLines({ rows = 3 }: { rows?: number }) {
  return (
    <div className="dash-skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="shimmer-anim"
          style={{ width: i % 2 === 0 ? '85%' : '60%' }}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  text,
  cta,
  onCta,
}: {
  icon: ReactNode;
  text: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="dash-empty">
      <div className="dash-empty__icon" aria-hidden="true">
        {icon}
      </div>
      <p>{text}</p>
      {cta && onCta ? (
        <button type="button" className="dash-btn-primary" onClick={onCta}>
          {cta}
        </button>
      ) : null}
    </div>
  );
}

export function ProgressBar({
  value,
  color = 'var(--brand)',
  height = 6,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  return (
    <div className="dash-progress" style={{ height }}>
      <div
        className="dash-progress__fill"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}
