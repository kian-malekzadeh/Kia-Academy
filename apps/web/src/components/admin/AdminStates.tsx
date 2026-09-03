'use client';

import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

/**
 * Shared admin UX-state primitives (loading / empty / error).
 * Used across admin pages so every view has consistent states.
 */

export function AdminSkeleton({
  className = '',
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`admin-skeleton ${className}`.trim()}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}

export function AdminLoading({ label }: { label?: string }) {
  const { t } = useLanguage();
  return (
    <div className="admin-content auth-loading" role="status">
      <Loader2 size={20} className="spin" aria-hidden /> {label ?? t('admin.states.loading')}
    </div>
  );
}

export function AdminEmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="admin-empty-state">
      <span aria-hidden>{icon ?? <Inbox />}</span>
      <strong>{title}</strong>
      {hint ? <p>{hint}</p> : null}
      {action ?? null}
      <span className="sr-only">{t('admin.states.empty')}</span>
    </div>
  );
}

export function AdminErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="admin-error-state" role="alert">
      <AlertTriangle aria-hidden />
      <strong>{t('admin.states.errorTitle')}</strong>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="admin-link-btn" onClick={onRetry}>
          {t('admin.states.retry')}
        </button>
      ) : null}
    </div>
  );
}
