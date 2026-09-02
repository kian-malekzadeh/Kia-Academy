'use client';

import type { AdminOrder } from '@kia-academy/shared';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

export default function AdminOrdersPage() {
  const { t, format } = useLanguage();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .adminListOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('admin.orders.error')))
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = orders.filter((order) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      order.userName.toLowerCase().includes(q) ||
      (order.userEmail ?? '').toLowerCase().includes(q) ||
      order.status.toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="admin-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('admin.orders.loading')}
      </div>
    );
  }

  return (
    <div className="admin-content">
      {error ? <p className="form-error">{error}</p> : null}

      <div style={{ marginBottom: '1rem', maxWidth: 360 }}>
        <input
          type="search"
          className="admin-input"
          placeholder={t('admin.orders.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <article className="admin-card">
        <div className="admin-section-head">
          <div>
            <h2>{t('admin.orders.title')}</h2>
            <p>{t('admin.orders.sub')}</p>
          </div>
        </div>
        <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.orders.col.date')}</th>
                <th>{t('admin.orders.col.user')}</th>
                <th>{t('admin.orders.col.items')}</th>
                <th>{t('admin.orders.col.total')}</th>
                <th>{t('admin.orders.col.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t('admin.orders.empty')}</td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id}>
                    <td>{format.date(order.createdAt)}</td>
                    <td>
                      <div>{order.userName}</div>
                      <div
                        className="ltr-isolate"
                        style={{ fontSize: '12px', color: 'var(--text-faint)' }}
                      >
                        {order.userEmail}
                      </div>
                    </td>
                    <td>{format.number(order.itemCount)}</td>
                    <td>{format.currency(order.totalCents)}</td>
                    <td>
                      <span className={`admin-badge${order.status === 'PAID' ? ' ok' : ''}`}>
                        {order.status}
                      </span>
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