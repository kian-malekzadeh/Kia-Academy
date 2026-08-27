'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { BrandMark } from '@/components/brand/BrandMark';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { resolvePostLoginPath } from '@/lib/postLoginPath';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout, user, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get('next') ?? '/dashboard';
  const nextNeedsAdmin = next.startsWith('/admin');

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user?.profileComplete) return;

    const isStaff = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    // /admin gate: keep the login form so a learner session can be replaced by admin creds.
    if (nextNeedsAdmin && !isStaff) {
      void logout();
      return;
    }

    router.replace(resolvePostLoginPath(user.role, next));
  }, [loading, isAuthenticated, user, next, nextNeedsAdmin, router, logout]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedIn = await login({ email, password });
      const dest = resolvePostLoginPath(loggedIn.role, next);
      router.push(dest);
    } catch {
      setError(t('auth.login.error'));
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
            <LogIn size={14} className="inline-leading-icon" />
            {t('auth.login.eyebrow')}
          </span>
          <h1>{t('auth.login.title')}</h1>
          <p className="auth-sub">{t('auth.login.sub')}</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>{t('auth.login.email')}</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.login.emailPlaceholder')}
                dir="ltr"
                className="ltr-isolate"
              />
            </label>
            <PasswordInput
              label={t('auth.login.password')}
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.login.passwordPlaceholder')}
              showLabel={t('auth.password.show')}
              hideLabel={t('auth.password.hide')}
            />
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="cta-primary auth-submit" disabled={submitting}>
              {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>

          <p className="auth-footer">
            {t('auth.login.footer')} <Link href="/register">{t('auth.login.createAccount')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <Suspense fallback={<div className="page-content auth-loading">{t('common.loading')}</div>}>
      <LoginForm />
    </Suspense>
  );
}
