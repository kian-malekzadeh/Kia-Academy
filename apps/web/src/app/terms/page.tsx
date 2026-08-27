'use client';

import { useLanguage } from '@/context/LanguageProvider';

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="page-content">
      <div className="container legal-shell">
        <h1>{t('legal.terms.title')}</h1>
        <p className="legal-updated">{t('legal.terms.updated')}</p>

        <section>
          <h2>{t('legal.terms.agreement.h')}</h2>
          <p>{t('legal.terms.agreement.p')}</p>
        </section>

        <section>
          <h2>{t('legal.terms.services.h')}</h2>
          <p>{t('legal.terms.services.p')}</p>
        </section>

        <section>
          <h2>{t('legal.terms.accounts.h')}</h2>
          <ul>
            <li>{t('legal.terms.accounts.li1')}</li>
            <li>{t('legal.terms.accounts.li2')}</li>
            <li>{t('legal.terms.accounts.li3')}</li>
            <li>{t('legal.terms.accounts.li4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('legal.terms.payments.h')}</h2>
          <p>{t('legal.terms.payments.p')}</p>
        </section>

        <section>
          <h2>{t('legal.terms.use.h')}</h2>
          <p>{t('legal.terms.use.intro')}</p>
          <ul>
            <li>{t('legal.terms.use.li1')}</li>
            <li>{t('legal.terms.use.li2')}</li>
            <li>{t('legal.terms.use.li3')}</li>
            <li>{t('legal.terms.use.li4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('legal.terms.ip.h')}</h2>
          <p>{t('legal.terms.ip.p')}</p>
        </section>

        <section>
          <h2>{t('legal.terms.disclaimer.h')}</h2>
          <p>{t('legal.terms.disclaimer.p')}</p>
        </section>

        <section>
          <h2>{t('legal.terms.contact.h')}</h2>
          <p>
            {t('legal.terms.contact.p').replace('legal@kia.academy', '').trim()}{' '}
            <a href="mailto:legal@kia.academy">legal@kia.academy</a>
          </p>
        </section>
      </div>
    </div>
  );
}
