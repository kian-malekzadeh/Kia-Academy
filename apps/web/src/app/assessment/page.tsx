'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { UnifiedTestFlow } from '@/components/test/UnifiedTestFlow';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';

export default function AssessmentPage() {
  return (
    <RequireAuth nextPath="/assessment" learnerFlow>
      <AssessmentContent />
    </RequireAuth>
  );
}

function AssessmentContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, learnerState, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user?.profileComplete && !learnerState?.profileComplete) {
      router.replace('/education');
    }
  }, [loading, user, learnerState, router]);

  if (loading) {
    return (
      <div className="page-content">
        <div className="container">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user?.profileComplete && !learnerState?.profileComplete) {
    return null;
  }

  return (
    <div className="page-content">
      <div className="container test-shell">
        <PageBackButton href="/education" />
        <UnifiedTestFlow backHref="/education" />
      </div>
    </div>
  );
}
