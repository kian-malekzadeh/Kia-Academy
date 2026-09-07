'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { FormEvent, Suspense, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { BrandMark } from '@/components/brand/BrandMark';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const tokenInvalid = token.length > 0 && !TOKEN_PATTERN.test(token);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (password !== passwordConfirm) {
      setError(t('auth.changePassword.mismatch'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.resetPassword({ token, password, passwordConfirm });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.resetPassword.error'));
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
            {t('auth.resetPassword.eyebrow')}
          </span>

          {done ? (
            <>
              <h1>{t('auth.resetPassword.successTitle')}</h1>
              <p className="auth-sub" role="status">
                <ShieldCheck size={16} className="inline-leading-icon" />
                {t('auth.resetPassword.successBody')}
              </p>
              <button
                type="button"
                className="cta-primary auth-submit"
                onClick={() => router.push('/login')}
              >
                {t('auth.resetPassword.goToLogin')}
              </button>
            </>
          ) : tokenInvalid ? (
            <>
              <h1>{t('auth.resetPassword.title')}</h1>
              <p className="form-error" role="alert">
                {t('auth.resetPassword.invalidLink')}
              </p>
              <Link href="/forgot-password" className="cta-primary auth-submit">
                {t('auth.forgotPassword.submit')}
              </Link>
            </>
          ) : (
            <>
              <h1>{t('auth.resetPassword.title')}</h1>
              <p className="auth-sub">{t('auth.resetPassword.sub')}</p>
              <form className="auth-form" onSubmit={handleSubmit}>
                <PasswordInput
                  label={t('auth.resetPassword.newPassword')}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showLabel={t('auth.password.show')}
                  hideLabel={t('auth.password.hide')}
                />
                <PasswordInput
                  label={t('auth.resetPassword.confirmPassword')}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  showLabel={t('auth.password.show')}
                  hideLabel={t('auth.password.hide')}
                />
                {error && <p className="form-error">{error}</p>}
                <button type="submit" className="cta-primary auth-submit" disabled={submitting}>
                  {submitting ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={<div className="page-content auth-loading">{t('common.loading')}</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
