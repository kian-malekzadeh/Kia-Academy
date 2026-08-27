'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AdminPayment } from '@kia-academy/shared';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

const PAYMENT_STATUSES = ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'] as const;

export default function AdminPaymentsPage() {
  const { t, format } = useLanguage();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api
      .adminListPayments()
      .then(setPayments)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : t('admin.payments.loadError'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((payment) => {
      if (statusFilter && payment.status !== statusFilter) return false;
      if (!q) return true;
      return (
        payment.userName.toLowerCase().includes(q) ||
        (payment.userEmail ?? '').toLowerCase().includes(q) ||
        payment.productType.toLowerCase().includes(q) ||
        payment.status.toLowerCase().includes(q) ||
        payment.id.toLowerCase().includes(q)
      );
    });
  }, [payments, search, statusFilter]);

  if (loading) {
    return (
      <div className="admin-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('admin.payments.loading')}
      </div>
    );
  }

  return (
    <div className="admin-content">
      <h1>{t('admin.payments.title')}</h1>
      <p className="admin-sub">{t('admin.payments.sub')}</p>
      {error && <p className="form-error">{error}</p>}

      <div className="admin-toolbar">
        <label className="form-field" style={{ flex: '1 1 220px', margin: 0 }}>
          <span className="sr-only">{t('admin.finance.search')}</span>
          <input
            className="admin-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.finance.searchPlaceholder')}
          />
        </label>
        <label className="form-field" style={{ flex: '0 1 180px', margin: 0 }}>
          <span className="sr-only">{t('admin.payments.col.status')}</span>
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('admin.finance.allStatuses')}</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`domain.payments.${status.toLowerCase()}` as 'domain.payments.completed')}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.payments.col.date')}</th>
              <th>{t('admin.payments.col.user')}</th>
              <th>{t('admin.payments.col.product')}</th>
              <th>{t('admin.payments.col.amount')}</th>
              <th>{t('admin.payments.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>{t('admin.payments.empty')}</td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>{format.date(p.createdAt)}</td>
                  <td>
                    <div>{p.userName}</div>
                    <div className="ltr-isolate" style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                      {p.userEmail}
                    </div>
                  </td>
                  <td>
                    <code>{p.productType}</code>
                  </td>
                  <td>{format.currency(p.amountCents)}</td>
                  <td>
                    <span className={`admin-badge${p.status === 'COMPLETED' ? ' ok' : ''}`}>
                      {t(`domain.payments.${p.status.toLowerCase()}` as 'domain.payments.completed')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
