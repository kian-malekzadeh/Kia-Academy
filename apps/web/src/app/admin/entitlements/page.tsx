'use client';

import type { AdminEntitlement, AdminUser } from '@kia-academy/shared';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

const RESOURCE_TYPES = ['course', 'readiness_test', 'roadmap_bundle'] as const;
const SOURCES = ['FREE', 'CHALLENGE', 'BUNDLE'] as const;

export default function AdminEntitlementsPage() {
  const { t, format } = useLanguage();
  const [entitlements, setEntitlements] = useState<AdminEntitlement[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState('');
  const [resourceType, setResourceType] = useState<string>('course');
  const [resourceId, setResourceId] = useState('');
  const [source, setSource] = useState<string>('FREE');

  useEffect(() => {
    Promise.all([api.adminListEntitlements(), api.adminListUsers()])
      .then(([nextEntitlements, nextUsers]) => {
        setEntitlements(nextEntitlements);
        setUsers(nextUsers.items);
        setUserId((current) => current || nextUsers.items[0]?.id || '');
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : t('admin.entitlements.error')),
      )
      .finally(() => setLoading(false));
  }, [t]);

  const grant = async () => {
    if (!userId || !resourceId.trim()) return;
    setBusy(true);
    setSaved('');
    try {
      const next = await api.adminGrantEntitlement({
        userId,
        resourceType,
        resourceId: resourceId.trim(),
        source,
      });
      setEntitlements((prev) => [next, ...prev]);
      setResourceId('');
      setSaved(t('admin.entitlements.granted'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('admin.entitlements.error'));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await api.adminRevokeEntitlement(id);
      setEntitlements((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('admin.entitlements.error'));
    }
  };

  if (loading) {
    return (
      <div className="admin-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('admin.entitlements.loading')}
      </div>
    );
  }

  return (
    <div className="admin-content">
      {error ? <p className="form-error">{error}</p> : null}
      {saved ? <p className="form-success">{saved}</p> : null}
      <article className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-section-head">
          <div>
            <h2>{t('admin.entitlements.grant')}</h2>
            <p>{t('admin.entitlements.grantSub')}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 640 }}>
          <select
            className="admin-input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} {user.email ? `(${user.email})` : ''}
              </option>
            ))}
          </select>
          <select
            className="admin-input"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
          >
            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`admin.entitlements.type.${type.replace('_', '')}` as 'admin.entitlements.type.course')}
              </option>
            ))}
          </select>
          <input
            className="admin-input ltr-isolate"
            placeholder={t('admin.entitlements.resourceId')}
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
          />
          <label style={{ display: 'grid', gap: '0.25rem', maxWidth: 240 }}>
            <span className="admin-sub">{t('admin.entitlements.source')}</span>
            <select
              className="admin-input"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {SOURCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="cta-primary"
            onClick={() => void grant()}
            disabled={busy || !userId || !resourceId.trim()}
          >
            {busy ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}{' '}
            {t('admin.entitlements.grantBtn')}
          </button>
        </div>
      </article>

      <article className="admin-card">
        <div className="admin-section-head">
          <div>
            <h2>{t('admin.entitlements.title')}</h2>
            <p>{t('admin.entitlements.sub')}</p>
          </div>
        </div>
        <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.entitlements.col.user')}</th>
                <th>{t('admin.entitlements.col.resource')}</th>
                <th>{t('admin.entitlements.col.source')}</th>
                <th>{t('admin.entitlements.col.date')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entitlements.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t('admin.entitlements.empty')}</td>
                </tr>
              ) : (
                entitlements.map((entitlement) => (
                  <tr key={entitlement.id}>
                    <td>
                      <div>{entitlement.userName}</div>
                      <div
                        className="ltr-isolate"
                        style={{ fontSize: '12px', color: 'var(--text-faint)' }}
                      >
                        {entitlement.userEmail}
                      </div>
                    </td>
                    <td>
                      <code>{entitlement.resourceType}</code> /{' '}
                      <code>{entitlement.resourceId}</code>
                    </td>
                    <td>{entitlement.source}</td>
                    <td>{format.date(entitlement.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="pill-btn"
                        onClick={() => void revoke(entitlement.id)}
                        aria-label={t('admin.entitlements.revoke')}
                      >
                        <Trash2 size={14} /> {t('admin.entitlements.revoke')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}