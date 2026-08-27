'use client';

import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useCart } from '@/context/CartProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { refreshSession } = useAuth();
  const { refresh: refreshCart } = useCart();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const authority =
        searchParams.get('Authority') ||
        searchParams.get('authority') ||
        searchParams.get('track_id') ||
        undefined;
      const status =
        searchParams.get('Status') ||
        searchParams.get('status') ||
        searchParams.get('success') ||
        undefined;
      const paymentId =
        searchParams.get('payment_id') ||
        searchParams.get('paymentId') ||
        searchParams.get('id') ||
        undefined;

      try {
        const result = await api.verifyPayment({
          paymentId: paymentId || undefined,
          authority: authority || undefined,
          status: status || undefined,
        });
        await refreshSession();
        await refreshCart();
        if (cancelled) return;
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        router.replace(
          result.success
            ? `/checkout/success?payment_id=${encodeURIComponent(result.payment.id)}`
            : '/checkout/cancel',
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : t('checkout.callback.failed'));
        setTimeout(() => {
          if (!cancelled) router.replace('/checkout/cancel');
        }, 2000);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, refreshSession, refreshCart, router, t]);

  return (
    <div className="page-content">
      <div className="container checkout-shell">
        <p className="auth-loading">
          <Loader2 size={24} className="spin" /> {t('checkout.callback.processing')}
        </p>
        {error ? <p className="form-error">{error}</p> : null}
      </div>
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackContent />
    </Suspense>
  );
}

function CallbackFallback() {
  const { t } = useLanguage();
  return (
    <div className="page-content auth-loading">
      <Loader2 size={24} className="spin" /> {t('checkout.callback.processing')}
    </div>
  );
}
