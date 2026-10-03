'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UnifiedTestFlow } from '@/components/test/UnifiedTestFlow';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';

const BACK_PATH = '/tracks/technology';

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
  const { user, learnerState, loading, signedOut } = useAuth();

  useEffect(() => {
    if (loading || signedOut) return;
    if (!user?.profileComplete && !learnerState?.profileComplete) {
      router.replace('/education');
    }
  }, [loading, signedOut, user, learnerState, router]);

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
        <UnifiedTestFlow backHref={BACK_PATH} />
      </div>
    </div>
  );
}
