'use client';

import Link from 'next/link';
import { ClipboardList, Hourglass, Loader2, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AdminPayment, AdminStats } from '@kia-academy/shared';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

const PAYMENT_STATUSES = ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'] as const;

export default function AdminFinancePage() {
  const { t, format } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([api.adminStats(), api.adminListPayments().catch(() => [] as AdminPayment[])])
      .then(([nextStats, nextPayments]) => {
        setStats(nextStats);
        setPayments(nextPayments);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : t('admin.finance.error'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const settledRevenue = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'COMPLETED')
        .reduce((acc, payment) => acc + payment.amountCents, 0),
    [payments],
  );

  const pendingAmount = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'PENDING')
        .reduce((acc, payment) => acc + payment.amountCents, 0),
    [payments],
  );

  const completedCount = useMemo(
    () => payments.filter((payment) => payment.status === 'COMPLETED').length,
    [payments],
  );

  const dailySettlements = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (13 - index));
      return date;
    });
    return days
      .map((day) => {
        const key = day.toISOString().slice(0, 10);
        const dayPayments = payments.filter(
          (payment) => payment.status === 'COMPLETED' && payment.createdAt.slice(0, 10) === key,
        );
        return {
          key,
          count: dayPayments.length,
          total: dayPayments.reduce((acc, payment) => acc + payment.amountCents, 0),
        };
      })
      .reverse();
  }, [payments]);

  const filteredLedger = useMemo(() => {
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
        <Loader2 size={24} className="spin" /> {t('admin.finance.loading')}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-content">
        <p className="form-error">{error || t('admin.finance.none')}</p>
      </div>
    );
  }

  return (
    <div className="admin-content">
      <div className="admin-stat-grid">
        <div className="admin-stat-card highlight">
          <div className="admin-stat-row">
            <div>
              <span className="admin-stat-label">{t('admin.finance.settled')}</span>
              <div className="admin-stat-value">{format.currency(settledRevenue)}</div>
            </div>
            <span className="admin-stat-icon">
              <Wallet size={18} />
            </span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-row">
            <div>
              <span className="admin-stat-label">{t('admin.finance.pending')}</span>
              <div className="admin-stat-value">{format.currency(pendingAmount)}</div>
            </div>
            <span className="admin-stat-icon">
              <Hourglass size={18} />
            </span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-row">
            <div>
              <span className="admin-stat-label">{t('admin.stats.payments')}</span>
              <div className="admin-stat-value">{format.number(completedCount)}</div>
            </div>
            <span className="admin-stat-icon">
              <ClipboardList size={18} />
            </span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-row">
            <div>
              <span className="admin-stat-label">{t('admin.finance.ledger')}</span>
              <div className="admin-stat-value">{format.number(payments.length)}</div>
            </div>
            <span className="admin-stat-icon">
              <ClipboardList size={18} />
            </span>
          </div>
        </div>
      </div>

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
        <Link href="/admin/payments" className="admin-link">
          {t('admin.nav.financeTransactions')}
        </Link>
      </div>

      <article className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-section-head">
          <div>
            <h2>{t('admin.finance.dailySettlements')}</h2>
            <p>{t('admin.finance.dailySettlementsSub')}</p>
          </div>
        </div>
        <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.finance.date')}</th>
                <th>{t('admin.analytics.count')}</th>
                <th>{t('admin.payments.col.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {dailySettlements.map((day) => (
                <tr key={day.key}>
                  <td>{format.date(day.key)}</td>
                  <td>{format.number(day.count)}</td>
                  <td>{format.currency(day.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="admin-card">
        <div className="admin-section-head">
          <div>
            <h2>{t('admin.finance.filteredLedger')}</h2>
            <p>{t('admin.finance.filteredLedgerSub')}</p>
          </div>
        </div>
        <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
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
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t('admin.payments.empty')}</td>
                </tr>
              ) : (
                filteredLedger.map((payment) => (
                  <tr key={payment.id}>
                    <td>{format.date(payment.createdAt)}</td>
                    <td>
                      <div>{payment.userName}</div>
                      <div
                        className="ltr-isolate"
                        style={{ fontSize: '12px', color: 'var(--text-faint)' }}
                      >
                        {payment.userEmail}
                      </div>
                    </td>
                    <td>
                      <code>{payment.productType}</code>
                    </td>
                    <td>{format.currency(payment.amountCents)}</td>
                    <td>
                      <span
                        className={`admin-badge${payment.status === 'COMPLETED' ? ' ok' : ''}`}
                      >
                        {t(
                          `domain.payments.${payment.status.toLowerCase()}` as 'domain.payments.completed',
                        )}
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
