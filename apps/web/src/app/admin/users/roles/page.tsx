'use client';

import Link from 'next/link';
import { Crown, Shield, UserRound } from 'lucide-react';
import { useLanguage } from '@/context/LanguageProvider';

export default function AdminUserRolesPage() {
  const { t } = useLanguage();

  return (
    <div className="admin-content">
      <h1>{t('admin.users.rolesTitle')}</h1>
      <p className="admin-sub">{t('admin.users.rolesSub')}</p>
      <p className="admin-sub">{t('admin.users.rolesHint')}</p>

      <div className="admin-grid admin-grid-3" style={{ marginBottom: '1.5rem' }}>
        <article className="admin-card">
          <div className="admin-stat-row" style={{ marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>{t('domain.roles.learner')}</h2>
            <span className="admin-stat-icon">
              <UserRound size={18} />
            </span>
          </div>
          <p className="admin-sub" style={{ marginBottom: 0 }}>
            {t('admin.users.roleLearnerDesc')}
          </p>
        </article>

        <article className="admin-card">
          <div className="admin-stat-row" style={{ marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>{t('domain.roles.moderator')}</h2>
            <span className="admin-stat-icon">
              <Shield size={18} />
            </span>
          </div>
          <p className="admin-sub" style={{ marginBottom: 0 }}>
            {t('admin.users.roleModeratorDesc')}
          </p>
        </article>

        <article className="admin-card">
          <div className="admin-stat-row" style={{ marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>{t('domain.roles.superAdmin')}</h2>
            <span className="admin-stat-icon">
              <Crown size={18} />
            </span>
          </div>
          <p className="admin-sub" style={{ marginBottom: 0 }}>
            {t('admin.users.roleSuperDesc')}
          </p>
        </article>
      </div>

      <Link href="/admin/users" className="cta-primary">
        {t('admin.users.openUsers')}
      </Link>
    </div>
  );
}
