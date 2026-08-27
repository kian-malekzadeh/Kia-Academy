'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';

/** Shared auth gate + loading shell for learner panel pages. */
export function DashboardGate({
  children,
  nextPath,
}: {
  children: ReactNode;
  nextPath: string;
}) {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/education?next=${encodeURIComponent(nextPath)}`);
    }
  }, [authLoading, isAuthenticated, nextPath, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="page-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('dashboard.loading')}
      </div>
    );
  }

  return <>{children}</>;
}

export function PanelPage({
  title,
  sub,
  eyebrow,
  actions,
  children,
}: {
  title: string;
  sub?: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page-content">
      <div className="container panel-page">
        <header className="page-head">
          <div>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h1>{title}</h1>
            {sub ? <p>{sub}</p> : null}
          </div>
          {actions}
        </header>
        {children}
      </div>
    </div>
  );
}
