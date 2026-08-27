'use client';

import Link from 'next/link';
import { BookOpen, Loader2, Trophy, Users, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AdminPayment, AdminStats } from '@kia-academy/shared';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

function weekdayLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { weekday: 'short' }).format(
    date,
  );
}

export default function AdminStatsPage() {
  const { t, format, locale } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.adminStats(), api.adminListPayments().catch(() => [] as AdminPayment[])])
      .then(([nextStats, nextPayments]) => {
        setStats(nextStats);
        setPayments(nextPayments);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : t('admin.stats.error'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const chart = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });
    const totals = days.map((day) => {
      const key = day.toISOString().slice(0, 10);
      const sum = payments
        .filter((payment) => payment.status === 'COMPLETED' && payment.createdAt.slice(0, 10) === key)
        .reduce((acc, payment) => acc + payment.amountCents, 0);
      return { label: weekdayLabel(day, locale), value: sum };
    });
    const max = Math.max(...totals.map((item) => item.value), 1);
    return totals.map((item) => ({
      ...item,
      pct: Math.max(8, Math.round((item.value / max) * 100)),
    }));
  }, [payments, locale]);

  const recentPayments = useMemo(() => payments.slice(0, 5), [payments]);

  if (loading) {
    return (
      <div className="admin-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('admin.stats.loading')}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-content">
        <p className="form-error">{error || t('admin.stats.none')}</p>
      </div>
    );
  }

  return (
    <div className="admin-content">
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-row">
            <div>
              <span className="admin-stat-label">{t('admin.stats.users')}</span>
              <div className="admin-stat-value">{format.number(stats.users)}</div>
            </div>
            <span className="admin-stat-icon">
              <Users size={18} />
            </span>
          </div>
        </div>
        <div className="admin-stat-card highlight">
          <div className="admin-stat-row">
            <div>
              <span className="admin-stat-label">{t('admin.stats.revenue')}</span>
              <div className="admin-stat-value">{format.currency(stats.revenueCents)}</div>
            </div>
            <span className="admin-stat-icon">
              <Wallet size={18} />
            </span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-row">
            <div>
              <span className="admin-stat-label">{t('admin.stats.payments')}</span>
              <div className="admin-stat-value">{format.number(stats.payments)}</div>
            </div>
            <span className="admin-stat-icon">
              <BookOpen size={18} />
            </span>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-row">
            <div>
              <span className="admin-stat-label">{t('admin.stats.activeChallenges')}</span>
              <div className="admin-stat-value">{format.number(stats.activeChallenges)}</div>
            </div>
            <span className="admin-stat-icon">
              <Trophy size={18} />
            </span>
          </div>
        </div>
      </div>

      <div className="admin-grid admin-grid-3" style={{ marginBottom: '1.5rem' }}>
        <article className="admin-card admin-span-2">
          <div className="admin-section-head">
            <div>
              <h2>{t('admin.stats.weeklyRevenue')}</h2>
              <p>{t('admin.stats.weeklyRevenueSub')}</p>
            </div>
            <Link href="/admin/finance" className="admin-link">
              {t('admin.stats.fullReport')}
            </Link>
          </div>
          <div className="admin-chart" aria-label={t('admin.stats.weeklyRevenue')}>
            {chart.map((bar) => (
              <span
                key={bar.label}
                className="admin-chart-bar"
                style={{ ['--value' as string]: `${bar.pct}%` }}
                data-label={bar.label}
                title={format.currency(bar.value)}
              />
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-section-head">
            <div>
              <h2>{t('admin.stats.snapshot')}</h2>
              <p>{t('admin.stats.snapshotSub')}</p>
            </div>
          </div>
          <div className="admin-list">
            <div className="admin-list-item">
              <div className="admin-list-copy">
                <strong>{t('admin.stats.courses')}</strong>
                <small>{format.number(stats.courses)}</small>
              </div>
            </div>
            <div className="admin-list-item">
              <div className="admin-list-copy">
                <strong>{t('admin.stats.lessons')}</strong>
                <small>{format.number(stats.lessons)}</small>
              </div>
            </div>
            <div className="admin-list-item">
              <div className="admin-list-copy">
                <strong>{t('admin.stats.enrollments')}</strong>
                <small>{format.number(stats.enrollments)}</small>
              </div>
            </div>
            <div className="admin-list-item">
              <div className="admin-list-copy">
                <strong>{t('admin.stats.challenges')}</strong>
                <small>{format.number(stats.challenges)}</small>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="admin-grid admin-grid-2" style={{ marginBottom: '1.5rem' }}>
        <article className="admin-card">
          <div className="admin-section-head">
            <div>
              <h2>{t('admin.stats.recentPayments')}</h2>
              <p>{t('admin.stats.recentPaymentsSub')}</p>
            </div>
            <Link href="/admin/payments" className="admin-link">
              {t('admin.stats.viewAll')}
            </Link>
          </div>
          <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.payments.col.user')}</th>
                  <th>{t('admin.payments.col.amount')}</th>
                  <th>{t('admin.payments.col.status')}</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={3}>{t('admin.payments.empty')}</td>
                  </tr>
                ) : (
                  recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.userName || payment.userEmail || payment.userId}</td>
                      <td>{format.currency(payment.amountCents)}</td>
                      <td>
                        <span
                          className={`admin-badge ${payment.status === 'COMPLETED' ? 'ok' : 'warning'}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-section-head">
            <div>
              <h2>{t('admin.stats.quickLinks')}</h2>
              <p>{t('admin.stats.quickLinksSub')}</p>
            </div>
          </div>
          <div className="admin-quick-links" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Link href="/admin/users" className="admin-card">
              <div className="admin-stat-row">
                <div>
                  <strong>{t('admin.nav.users')}</strong>
                  <p className="admin-stat-label">{format.number(stats.users)}</p>
                </div>
                <span className="admin-stat-icon">
                  <Users size={16} />
                </span>
              </div>
            </Link>
            <Link href="/admin/courses" className="admin-card">
              <div className="admin-stat-row">
                <div>
                  <strong>{t('admin.nav.courses')}</strong>
                  <p className="admin-stat-label">{format.number(stats.courses)}</p>
                </div>
                <span className="admin-stat-icon">
                  <BookOpen size={16} />
                </span>
              </div>
            </Link>
            <Link href="/admin/finance" className="admin-card">
              <div className="admin-stat-row">
                <div>
                  <strong>{t('admin.nav.finance')}</strong>
                  <p className="admin-stat-label">{format.currency(stats.revenueCents)}</p>
                </div>
                <span className="admin-stat-icon">
                  <Wallet size={16} />
                </span>
              </div>
            </Link>
            <Link href="/admin/analytics" className="admin-card">
              <div className="admin-stat-row">
                <div>
                  <strong>{t('admin.nav.analytics')}</strong>
                  <p className="admin-stat-label">{format.number(stats.payments)}</p>
                </div>
                <span className="admin-stat-icon">
                  <Trophy size={16} />
                </span>
              </div>
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
