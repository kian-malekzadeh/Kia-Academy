'use client';

import Link from 'next/link';
import { Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { PageBackButton } from '@/components/layout/PageBackButton';
import { useLanguage } from '@/context/LanguageProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { api, ApiError } from '@/lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [clientError, setClientError] = useState('');
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): string | null => {
    if (name.trim().length < 2) return t('contact.errors.name');
    if (!EMAIL_RE.test(email.trim())) return t('contact.errors.email');
    if (subject.trim().length < 3) return t('contact.errors.subject');
    if (message.trim().length < 10) return t('contact.errors.message');
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setClientError('');
    setServerError('');
    setSuccess(false);

    const validationError = validate();
    if (validationError) {
      setClientError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await api.submitContactForm({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t('contact.errors.server'));
    } finally {
      setSubmitting(false);
    }
  };

  const supportEmail = settings.general.supportEmail || 'support@kia.academy';

  return (
    <div className="page-content">
      <div className="container contact-shell">
        <PageBackButton href="/" label={t('contact.backHome')} />

        <span className="eyebrow">
          <Mail size={14} className="inline-leading-icon" />
          {t('contact.eyebrow')}
        </span>
        <h1>{t('contact.title')}</h1>
        <p className="auth-sub">{t('contact.sub')}</p>

        <div className="contact-grid">
          <aside className="contact-info">
            <h2>{t('contact.infoTitle')}</h2>
            <p>{t('contact.infoBody')}</p>
            <ul className="contact-info-list">
              <li>
                <Mail size={16} aria-hidden="true" />
                <a href={`mailto:${supportEmail}`} className="ltr-isolate">
                  {supportEmail}
                </a>
              </li>
              <li>
                <Phone size={16} aria-hidden="true" />
                <span className="ltr-isolate">{t('contact.phone')}</span>
              </li>
              <li>
                <MapPin size={16} aria-hidden="true" />
                <span>{t('contact.address')}</span>
              </li>
            </ul>
            <p className="contact-note">{t('contact.responseTime')}</p>
          </aside>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <label className="form-field">
              <span>{t('contact.fields.name')}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
              />
            </label>
            <label className="form-field">
              <span>{t('contact.fields.email')}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label className="form-field">
              <span>{t('contact.fields.subject')}</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                minLength={3}
                maxLength={200}
              />
            </label>
            <label className="form-field">
              <span>{t('contact.fields.message')}</span>
              <textarea
                className="admin-textarea"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={10}
                maxLength={5000}
              />
            </label>

            {clientError && <p className="form-error">{clientError}</p>}
            {serverError && <p className="form-error">{serverError}</p>}
            {success && <p className="form-success">{t('contact.success')}</p>}

            <button type="submit" className="cta-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={18} className="spin" /> {t('contact.sending')}
                </>
              ) : (
                t('contact.submit')
              )}
            </button>
          </form>
        </div>

        <p className="contact-alt">
          {t('contact.alt')}{' '}
          <Link href="/education">{t('landing.ctaEducation')}</Link>
        </p>
      </div>
    </div>
  );
}
