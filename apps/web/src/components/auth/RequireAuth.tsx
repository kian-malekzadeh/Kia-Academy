'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';

interface RequireAuthProps {
  children: ReactNode;
  nextPath: string;
  /** When true, unauthenticated users go to phone OTP education flow instead of email login. */
  learnerFlow?: boolean;
}

/** Client-side auth gate (replaces Next.js middleware for static / GitHub Pages builds). */
export function RequireAuth({ children, nextPath, learnerFlow = false }: RequireAuthProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { loading, isAuthenticated, learnerState } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      const encoded = encodeURIComponent(nextPath);
      if (learnerFlow) {
        router.replace(`/education?next=${encoded}`);
      } else {
        router.replace(`/login?next=${encoded}`);
      }
      return;
    }
    if (learnerFlow && learnerState && !learnerState.profileComplete) {
      router.replace(`/education?next=${encodeURIComponent(nextPath)}`);
    }
  }, [loading, isAuthenticated, learnerState, router, nextPath, learnerFlow]);

  if (loading || !isAuthenticated) {
    return <div className="page-content auth-loading">{t('common.loading')}</div>;
  }

  if (learnerFlow && learnerState && !learnerState.profileComplete) {
    return <div className="page-content auth-loading">{t('common.loading')}</div>;
  }

  return <>{children}</>;
}
