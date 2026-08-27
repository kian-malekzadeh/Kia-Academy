'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { FormEvent, Suspense, useState } from 'react';
import {
  containsUnsafeText,
  isSecurePassword,
  isValidEmail,
  isValidIranCity,
  isValidIranProvince,
  passwordsMatch,
  sanitizeProfileText,
} from '@kia-academy/shared';
import { BrandMark } from '@/components/brand/BrandMark';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrengthChecker } from '@/components/auth/PasswordStrengthChecker';
import { ProvinceCityFields } from '@/components/auth/ProvinceCityFields';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { resolvePostLoginPath } from '@/lib/postLoginPath';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get('next') ?? '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const nextErrors: Record<string, string> = {};
    const cleanName = sanitizeProfileText(name);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) nextErrors.name = t('auth.register.required');
    else if (containsUnsafeText(cleanName)) nextErrors.name = t('auth.register.unsafe');

    if (!cleanEmail) nextErrors.email = t('auth.register.required');
    else if (!isValidEmail(cleanEmail) || containsUnsafeText(cleanEmail)) {
      nextErrors.email = t('auth.register.emailInvalid');
    }

    if (!isSecurePassword(password)) nextErrors.password = t('auth.password.policyError');
    if (!passwordsMatch(password, passwordConfirm)) {
      nextErrors.passwordConfirm = t('auth.password.mismatch');
    }

    if (!isValidIranProvince(province)) nextErrors.province = t('auth.register.provinceRequired');
    if (!isValidIranCity(province, city)) nextErrors.city = t('auth.register.cityRequired');

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const user = await register({
        name: cleanName,
        email: cleanEmail,
        password,
        passwordConfirm,
        province,
        city,
      });
      router.push(resolvePostLoginPath(user.role, next));
    } catch {
      setFormError(t('auth.register.error'));
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
            <UserPlus size={14} className="inline-leading-icon" />
            {t('auth.register.eyebrow')}
          </span>
          <h1>{t('auth.register.title')}</h1>
          <p className="auth-sub">{t('auth.register.sub')}</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="form-field">
              <span>{t('auth.register.fullName')}</span>
              <input
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.register.namePlaceholder')}
              />
              {errors.name ? <span className="form-error">{errors.name}</span> : null}
            </label>
            <label className="form-field">
              <span>{t('auth.register.email')}</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.register.emailPlaceholder')}
                dir="ltr"
                className="ltr-isolate"
              />
              {errors.email ? <span className="form-error">{errors.email}</span> : null}
            </label>

            <PasswordInput
              label={t('auth.register.password')}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.register.passwordPlaceholder')}
              showLabel={t('auth.password.show')}
              hideLabel={t('auth.password.hide')}
              error={errors.password}
              hint={
                <PasswordStrengthChecker
                  password={password}
                  title={t('auth.password.requirements')}
                  labels={{
                    minLength: t('auth.password.req.minLength'),
                    uppercase: t('auth.password.req.uppercase'),
                    lowercase: t('auth.password.req.lowercase'),
                    number: t('auth.password.req.number'),
                    special: t('auth.password.req.special'),
                  }}
                />
              }
            />

            <PasswordInput
              label={t('auth.register.passwordConfirm')}
              autoComplete="new-password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder={t('auth.register.passwordConfirmPlaceholder')}
              showLabel={t('auth.password.show')}
              hideLabel={t('auth.password.hide')}
              error={errors.passwordConfirm}
            />

            <ProvinceCityFields
              province={province}
              city={city}
              onProvinceChange={setProvince}
              onCityChange={setCity}
              provinceLabel={t('auth.register.province')}
              cityLabel={t('auth.register.city')}
              provincePlaceholder={t('auth.register.provincePlaceholder')}
              cityPlaceholder={t('auth.register.cityPlaceholder')}
              provinceError={errors.province}
              cityError={errors.city}
            />

            {formError ? <p className="form-error">{formError}</p> : null}
            <button type="submit" className="cta-primary auth-submit" disabled={submitting}>
              {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
            </button>
          </form>

          <p className="auth-footer">
            {t('auth.register.footer')} <Link href="/login">{t('auth.register.signIn')}</Link>
          </p>
          <p className="auth-footer">
            <Link href="/education">{t('auth.register.phoneSignup')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="page-content auth-loading">{t('common.loading')}</div>}>
      <RegisterForm />
    </Suspense>
  );
}
