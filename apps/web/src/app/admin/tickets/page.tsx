'use client';

import type { AdminTicketStatus, AdminTicketSummary } from '@kia-academy/shared';
import { Loader2, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

const STATUSES: AdminTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function AdminTicketsPage() {
  const { t, format } = useLanguage();
  const [tickets, setTickets] = useState<AdminTicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .adminListTickets()
      .then(setTickets)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('admin.tickets.error')))
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter && ticket.status !== statusFilter) return false;
      if (!q) return true;
      return (
        ticket.subject.toLowerCase().includes(q) ||
        ticket.userName.toLowerCase().includes(q) ||
        (ticket.userEmail ?? '').toLowerCase().includes(q) ||
        ticket.id.toLowerCase().includes(q)
      );
    });
  }, [tickets, search, statusFilter]);

  if (loading) {
    return (
      <div className="admin-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('admin.tickets.loading')}
      </div>
    );
  }

  return (
    <div className="admin-content">
      {error ? <p className="form-error">{error}</p> : null}

      <div className="admin-toolbar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="search"
          className="admin-input"
          placeholder={t('admin.tickets.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 220px' }}
        />
        <select
          className="admin-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ flex: '0 0 180px' }}
        >
          <option value="">{t('admin.tickets.allStatuses')}</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`admin.tickets.status.${status.toLowerCase()}` as 'admin.tickets.status.open')}
            </option>
          ))}
        </select>
      </div>

      <article className="admin-card">
        <div className="admin-section-head">
          <div>
            <h2>{t('admin.tickets.title')}</h2>
            <p>{t('admin.tickets.sub')}</p>
          </div>
          <span className="admin-badge info">
            <Ticket size={12} />
            {format.number(filtered.length)}
          </span>
        </div>
        <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.tickets.col.subject')}</th>
                <th>{t('admin.tickets.col.user')}</th>
                <th>{t('admin.tickets.col.course')}</th>
                <th>{t('admin.tickets.col.status')}</th>
                <th>{t('admin.tickets.col.priority')}</th>
                <th>{t('admin.tickets.col.replies')}</th>
                <th>{t('admin.tickets.col.date')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>{t('admin.tickets.empty')}</td>
                </tr>
              ) : (
                filtered.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <Link href={`/admin/tickets/${ticket.id}`} className="admin-link">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td>
                      <div>{ticket.userName}</div>
                      <div
                        className="ltr-isolate"
                        style={{ fontSize: '12px', color: 'var(--text-faint)' }}
                      >
                        {ticket.userEmail}
                      </div>
                    </td>
                    <td>{ticket.courseTitle ?? '—'}</td>
                    <td>
                      <span
                        className={`admin-badge${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? ' ok' : ''}`}
                      >
                        {t(
                          `admin.tickets.status.${ticket.status.toLowerCase()}` as 'admin.tickets.status.open',
                        )}
                      </span>
                    </td>
                    <td>{t(`admin.tickets.priority.${ticket.priority.toLowerCase()}` as 'admin.tickets.priority.normal')}</td>
                    <td>{format.number(ticket.replyCount)}</td>
                    <td>{format.date(ticket.createdAt)}</td>
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