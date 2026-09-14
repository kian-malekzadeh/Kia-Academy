'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AdminPayment } from '@kia-academy/shared';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';
import {
  AdminSortHeader,
  AdminStatusBadge,
  AdminTableToolbar,
  sortRows,
  type SortState,
} from '@/components/admin/AdminPro';

const PAYMENT_STATUSES = ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'] as const;

type PaymentTone = 'ok' | 'warning' | 'danger' | 'info';

/** Redundant tone mapping: status text is always shown beside the badge color. */
function paymentTone(status: string): PaymentTone {
  switch (status) {
    case 'COMPLETED':
      return 'ok';
    case 'PENDING':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'info';
  }
}

export default function AdminPaymentsPage() {
  const { t, format } = useLanguage();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState<SortState>(null);

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
    const rows = payments.filter((payment) => {
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
    return sortRows(rows, sort, {
      date: (row) => row.createdAt,
      user: (row) => row.userName,
      product: (row) => row.productType,
      amount: (row) => row.amountCents,
      status: (row) => row.status,
    });
  }, [payments, search, statusFilter, sort]);

  const filteredTotal = useMemo(
    () => filtered.reduce((acc, payment) => acc + payment.amountCents, 0),
    [filtered],
  );

  const onSort = (key: string) => {
    setSort((prev) =>
      prev?.key === key ? (prev.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' },
    );
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSort(null);
  };

  if (loading) {
    return (
      <div className="admin-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('admin.payments.loading')}
      </div>
    );
  }

  const hasFilters = Boolean(search || statusFilter || sort);

  return (
    <div className="admin-content">
      <h1>{t('admin.payments.title')}</h1>
      <p className="admin-sub">{t('admin.payments.sub')}</p>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="apro-toolbar">
        <AdminTableToolbar
          search={search}
          onSearchChange={setSearch}
          searchLabel={t('admin.finance.search')}
          searchPlaceholder={t('admin.finance.searchPlaceholder')}
        >
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label={t('admin.payments.col.status')}
          >
            <option value="">{t('admin.finance.allStatuses')}</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`domain.payments.${status.toLowerCase()}` as 'domain.payments.completed')}
              </option>
            ))}
          </select>
          <span className="admin-badge info">
            {format.number(filtered.length)} / {format.number(payments.length)}
          </span>
          {hasFilters ? (
            <button type="button" className="admin-link-btn" onClick={resetFilters}>
              {t('admin.pro.resetFilters')}
            </button>
          ) : null}
        </AdminTableToolbar>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <AdminSortHeader
                label={t('admin.payments.col.date')}
                sortKey="date"
                sort={sort}
                onSort={onSort}
              />
              <AdminSortHeader
                label={t('admin.payments.col.user')}
                sortKey="user"
                sort={sort}
                onSort={onSort}
              />
              <AdminSortHeader
                label={t('admin.payments.col.product')}
                sortKey="product"
                sort={sort}
                onSort={onSort}
              />
              <AdminSortHeader
                label={t('admin.payments.col.amount')}
                sortKey="amount"
                sort={sort}
                onSort={onSort}
              />
              <AdminSortHeader
                label={t('admin.payments.col.status')}
                sortKey="status"
                sort={sort}
                onSort={onSort}
              />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  {payments.length === 0
                    ? t('admin.payments.empty')
                    : t('admin.pro.emptyFiltered')}
                </td>
              </tr>
            ) : (
              filtered.map((payment) => (
                <tr key={payment.id}>
                  <td>{format.date(payment.createdAt)}</td>
                  <td>
                    <div>{payment.userName}</div>
                    <div className="ltr-isolate admin-cell-meta">{payment.userEmail}</div>
                  </td>
                  <td>
                    <code>{payment.productType}</code>
                  </td>
                  <td className="apro-num">{format.currency(payment.amountCents)}</td>
                  <td>
                    <AdminStatusBadge tone={paymentTone(payment.status)}>
                      {t(
                        `domain.payments.${payment.status.toLowerCase()}` as 'domain.payments.completed',
                      )}
                    </AdminStatusBadge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 ? (
        <p className="admin-meta" style={{ marginTop: '0.75rem' }}>
          {t('admin.pro.total')}: {format.currency(filteredTotal)}
        </p>
      ) : null}
    </div>
  );
}
