'use client';

import Link from 'next/link';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  createDefaultSiteSettings,
  normalizeAdminAccess,
  type SiteAdminAccessSettings,
  type UserRole,
} from '@kia-academy/shared';
import { AdminAccessMatrix } from '@/components/admin/AdminAccessMatrix';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import type { AdminUser } from '@kia-academy/shared';

function roleLabel(role: UserRole, t: (key: string) => string): string {
  if (role === 'SUPER_ADMIN') return t('domain.roles.superAdmin');
  if (role === 'ADMIN') return t('domain.roles.moderator');
  return t('domain.roles.learner');
}

const defaultModeratorAccess = () =>
  normalizeAdminAccess(createDefaultSiteSettings().adminAccess);

export default function AdminUsersPage() {
  const { t, format } = useLanguage();
  const { user: me } = useAuth();
  const isSuper = me?.role === 'SUPER_ADMIN';
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole>>({});
  const [draftAccess, setDraftAccess] = useState<Record<string, SiteAdminAccessSettings>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [savingAccessId, setSavingAccessId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'success' | 'error'>>({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    api
      .adminListUsers()
      .then((list) => {
        setUsers(list);
        setDraftRoles(Object.fromEntries(list.map((u) => [u.id, u.role])));
        setDraftAccess(
          Object.fromEntries(
            list.map((u) => [
              u.id,
              u.role === 'ADMIN'
                ? normalizeAdminAccess(u.adminPanelAccess ?? defaultModeratorAccess())
                : defaultModeratorAccess(),
            ]),
          ),
        );
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : t('admin.users.loadError'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (!q) return true;
      const roleText = roleLabel(user.role, t).toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        (user.email ?? '').toLowerCase().includes(q) ||
        (user.phone ?? '').toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q) ||
        roleText.includes(q)
      );
    });
  }, [users, search, roleFilter, t]);

  const saveRole = async (user: AdminUser) => {
    const nextRole = draftRoles[user.id];
    if (!nextRole || nextRole === user.role) return;

    if (nextRole === 'SUPER_ADMIN' && !isSuper) {
      setError(t('admin.users.onlySuper'));
      setDraftRoles((prev) => ({ ...prev, [user.id]: user.role }));
      return;
    }

    setUpdatingId(user.id);
    setError('');
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[user.id];
      return next;
    });

    try {
      const updated = await api.adminUpdateUserRole(user.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setDraftRoles((prev) => ({ ...prev, [user.id]: updated.role }));
      if (updated.role === 'ADMIN' && updated.adminPanelAccess) {
        setDraftAccess((prev) => ({
          ...prev,
          [user.id]: normalizeAdminAccess(updated.adminPanelAccess),
        }));
      }
      setFeedback((prev) => ({ ...prev, [user.id]: 'success' }));
    } catch (err) {
      setDraftRoles((prev) => ({ ...prev, [user.id]: user.role }));
      setFeedback((prev) => ({ ...prev, [user.id]: 'error' }));
      setError(err instanceof ApiError ? err.message : t('admin.users.roleError'));
    } finally {
      setUpdatingId(null);
    }
  };

  const saveAccess = async (user: AdminUser) => {
    const access = draftAccess[user.id];
    if (!access || user.role !== 'ADMIN') return;

    setSavingAccessId(user.id);
    setError('');
    try {
      const updated = await api.adminUpdateUserAccess(user.id, access);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setDraftAccess((prev) => ({
        ...prev,
        [user.id]: normalizeAdminAccess(updated.adminPanelAccess ?? access),
      }));
      setFeedback((prev) => ({ ...prev, [`access-${user.id}`]: 'success' }));
    } catch (err) {
      setFeedback((prev) => ({ ...prev, [`access-${user.id}`]: 'error' }));
      setError(err instanceof ApiError ? err.message : t('admin.users.accessError'));
    } finally {
      setSavingAccessId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('admin.users.loading')}
      </div>
    );
  }

  return (
    <div className="admin-content">
      <div className="admin-header-row">
        <div>
          <h1>{t('admin.users.title')}</h1>
          <p className="admin-sub">{t('admin.users.sub')}</p>
          {isSuper && <p className="admin-sub">{t('admin.users.moderatorAccessHint')}</p>}
        </div>
        <Link href="/admin/users/create" className="cta-primary">
          <Plus size={16} /> {t('admin.nav.usersCreate')}
        </Link>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="admin-toolbar">
        <label className="form-field" style={{ flex: '1 1 220px', margin: 0 }}>
          <span className="sr-only">{t('admin.users.search')}</span>
          <input
            className="admin-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.users.searchPlaceholder')}
          />
        </label>
        <label className="form-field" style={{ flex: '0 1 180px', margin: 0 }}>
          <span className="sr-only">{t('admin.users.col.role')}</span>
          <select
            className="admin-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">{t('admin.users.allRoles')}</option>
            <option value="LEARNER">{t('domain.roles.learner')}</option>
            <option value="ADMIN">{t('domain.roles.moderator')}</option>
            <option value="SUPER_ADMIN">{t('domain.roles.superAdmin')}</option>
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.users.col.name')}</th>
              <th>{t('admin.users.col.email')}</th>
              <th>{t('admin.users.col.role')}</th>
              <th>{t('admin.users.col.joined')}</th>
              <th>{t('admin.users.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const draft = draftRoles[user.id] ?? user.role;
              const dirty = draft !== user.role;
              const rowFeedback = feedback[user.id];
              const isModerator = user.role === 'ADMIN';
              const showAccess = isSuper && isModerator;

              return (
                <Fragment key={user.id}>
                  <tr>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`admin-badge${
                          user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? ' ok' : ''
                        }`}
                      >
                        {roleLabel(user.role, t)}
                      </span>
                    </td>
                    <td>{format.date(user.createdAt)}</td>
                    <td>
                      <div className="admin-role-save-row">
                        <label className="admin-role-picker">
                          <span className="sr-only">{t('admin.users.changeRole')}</span>
                          <select
                            value={draft}
                            disabled={
                              updatingId === user.id || (!isSuper && user.role === 'SUPER_ADMIN')
                            }
                            onChange={(e) =>
                              setDraftRoles((prev) => ({
                                ...prev,
                                [user.id]: e.target.value as UserRole,
                              }))
                            }
                          >
                            <option value="LEARNER">{t('domain.roles.learner')}</option>
                            <option value="ADMIN">{t('domain.roles.moderator')}</option>
                            {isSuper && (
                              <option value="SUPER_ADMIN">{t('domain.roles.superAdmin')}</option>
                            )}
                          </select>
                        </label>
                        <button
                          type="button"
                          className="btn-next admin-btn"
                          disabled={!dirty || updatingId === user.id}
                          onClick={() => void saveRole(user)}
                        >
                          {updatingId === user.id ? (
                            <>
                              <Loader2 size={14} className="spin" /> {t('admin.users.updating')}
                            </>
                          ) : (
                            t('admin.users.saveRole')
                          )}
                        </button>
                        {rowFeedback === 'success' && (
                          <span className="form-success admin-inline-status">
                            <Check size={14} /> {t('admin.users.roleUpdated')}
                          </span>
                        )}
                        {rowFeedback === 'error' && (
                          <span className="form-error admin-inline-status">
                            <X size={14} /> {t('admin.users.roleError')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {showAccess && (
                    <tr key={`${user.id}-access`}>
                      <td colSpan={5}>
                        <div className="admin-moderator-access">
                          <h3 className="admin-sub" style={{ marginTop: 0 }}>
                            {t('admin.users.accessFor', { name: user.name })}
                          </h3>
                          <AdminAccessMatrix
                            access={draftAccess[user.id] ?? defaultModeratorAccess()}
                            onChange={(next) =>
                              setDraftAccess((prev) => ({ ...prev, [user.id]: next }))
                            }
                          />
                          <button
                            type="button"
                            className="cta-primary"
                            style={{ marginTop: '0.75rem' }}
                            disabled={savingAccessId === user.id}
                            onClick={() => void saveAccess(user)}
                          >
                            {savingAccessId === user.id
                              ? t('admin.users.savingAccess')
                              : t('admin.users.saveAccess')}
                          </button>
                          {feedback[`access-${user.id}`] === 'success' && (
                            <p className="form-success">{t('admin.users.accessSaved')}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
