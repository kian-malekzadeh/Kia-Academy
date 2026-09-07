'use client';

import Link from 'next/link';
import { KeyRound, MailCheck } from 'lucide-react';
import { FormEvent, Suspense, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { BrandMark } from '@/components/brand/BrandMark';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

function ForgotPasswordForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      // Uniform response server-side: the success screen never reveals
      // whether the address exists (account enumeration protection).
      await api.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.forgotPassword.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="container auth-shell">
        <PageBackButton href="/" />
        <div className="auth-card">
          <Link href="/" className="education-brand" aria-label={t('common.brand')}>
            <BrandMark className="education-brand-mark" size={28} title="" />
            {t('common.brand')}
          </Link>
          <span className="eyebrow">
            <KeyRound size={14} className="inline-leading-icon" />
            {t('auth.forgotPassword.eyebrow')}
          </span>
          <h1>{t('auth.forgotPassword.title')}</h1>
          <p className="auth-sub">{t('auth.forgotPassword.sub')}</p>

          {sent ? (
            <div className="auth-form" role="status">
              <p className="form-success">
                <MailCheck size={18} className="inline-leading-icon" />
                <strong>{t('auth.forgotPassword.sentTitle')}</strong>
              </p>
              <p>{t('auth.forgotPassword.sentBody')}</p>
              <Link href="/login" className="cta-primary auth-submit">
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="form-field">
                <span>{t('auth.forgotPassword.email')}</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.forgotPassword.emailPlaceholder')}
                  dir="ltr"
                  className="ltr-isolate"
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="cta-primary auth-submit" disabled={submitting}>
                {submitting
                  ? t('auth.forgotPassword.submitting')
                  : t('auth.forgotPassword.submit')}
              </button>
            </form>
          )}

          <p className="auth-footer">
            {t('auth.login.footer')} <Link href="/login">{t('auth.login.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={<div className="page-content auth-loading">{t('common.loading')}</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
