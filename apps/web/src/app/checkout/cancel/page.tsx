'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

function CancelContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  return (
    <div className="page-content">
      <div className="container checkout-result">
        <XCircle size={48} className="checkout-result-icon cancel" />
        <h1>{t('checkout.cancel.title')}</h1>
        <p className="auth-sub">{t('checkout.cancel.sub')}</p>
        {paymentId ? (
          <p className="auth-sub ltr-isolate mono">{paymentId}</p>
        ) : null}
        <div className="checkout-result-actions">
          <Link href="/cart" className="cta-primary">
            {t('checkout.cancel.backCart')}
          </Link>
          <Link href="/dashboard/finance#orders" className="cta-secondary">
            {t('checkout.cancel.retryFinance')}
          </Link>
          <Link href="/checkout" className="cta-secondary">
            {t('checkout.cancel.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<div className="page-content auth-loading">…</div>}>
      <CancelContent />
    </Suspense>
  );
}
