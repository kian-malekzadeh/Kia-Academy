'use client';

import { useLanguage } from '@/context/LanguageProvider';

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="page-content">
      <div className="container legal-shell">
        <h1>{t('legal.privacy.title')}</h1>
        <p className="legal-updated">{t('legal.privacy.updated')}</p>

        <section>
          <h2>{t('legal.privacy.overview.h')}</h2>
          <p>{t('legal.privacy.overview.p')}</p>
        </section>

        <section>
          <h2>{t('legal.privacy.collect.h')}</h2>
          <ul>
            <li>{t('legal.privacy.collect.account')}</li>
            <li>{t('legal.privacy.collect.learning')}</li>
            <li>{t('legal.privacy.collect.payment')}</li>
            <li>{t('legal.privacy.collect.tech')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('legal.privacy.use.h')}</h2>
          <p>{t('legal.privacy.use.intro')}</p>
          <ul>
            <li>{t('legal.privacy.use.li1')}</li>
            <li>{t('legal.privacy.use.li2')}</li>
            <li>{t('legal.privacy.use.li3')}</li>
            <li>{t('legal.privacy.use.li4')}</li>
            <li>{t('legal.privacy.use.li5')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('legal.privacy.cookies.h')}</h2>
          <p>{t('legal.privacy.cookies.p')}</p>
        </section>

        <section>
          <h2>{t('legal.privacy.retention.h')}</h2>
          <p>{t('legal.privacy.retention.p')}</p>
        </section>

        <section>
          <h2>{t('legal.privacy.contact.h')}</h2>
          <p>
            {t('legal.privacy.contact.p').replace('privacy@kia.academy.', '').trim()}{' '}
            <a href="mailto:privacy@kia.academy">privacy@kia.academy</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
