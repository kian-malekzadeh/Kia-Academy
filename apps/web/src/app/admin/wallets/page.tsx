'use client';

import type { AdminWalletDetail, AdminWalletSummary } from '@kia-academy/shared';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';
import { api, ApiError } from '@/lib/api';

export default function AdminWalletsPage() {
  const { t, format } = useLanguage();
  const [wallets, setWallets] = useState<AdminWalletSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<AdminWalletDetail | null>(null);
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    api
      .adminListWallets()
      .then(setWallets)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('admin.wallets.error')))
      .finally(() => setLoading(false));
  }, [t]);

  const openDetail = async (userId: string) => {
    setError('');
    try {
      const next = await api.adminGetWallet(userId);
      setDetail(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('admin.wallets.error'));
    }
  };

  const adjust = async () => {
    if (!detail || !amount.trim() || !description.trim()) return;
    const amountCents = Number(amount.replace(/[^\d]/g, ''));
    if (!Number.isFinite(amountCents) || amountCents <= 0) return;
    setBusy(true);
    setSaved('');
    setError('');
    try {
      const next = await api.adminAdjustWallet(detail.userId, {
        type,
        amountCents,
        description: description.trim(),
      });
      setDetail(next);
      setWallets((prev) =>
        prev.map((wallet) =>
          wallet.userId === next.userId
            ? {
                ...wallet,
                balanceCents: next.balanceCents,
                transactionCount: next.transactionCount,
                lastTransactionAt: next.lastTransactionAt,
              }
            : wallet,
        ),
      );
      setAmount('');
      setDescription('');
      setSaved(t('admin.wallets.adjusted'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('admin.wallets.error'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-content auth-loading">
        <Loader2 size={24} className="spin" /> {t('admin.wallets.loading')}
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
            <h2>{t('admin.wallets.title')}</h2>
            <p>{t('admin.wallets.sub')}</p>
          </div>
        </div>
        <div className="admin-table-wrap" style={{ marginBottom: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.wallets.col.user')}</th>
                <th>{t('admin.wallets.col.balance')}</th>
                <th>{t('admin.wallets.col.txns')}</th>
                <th>{t('admin.wallets.col.lastTxn')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t('admin.wallets.empty')}</td>
                </tr>
              ) : (
                wallets.map((wallet) => (
                  <tr key={wallet.userId}>
                    <td>
                      <div>{wallet.userName}</div>
                      <div
                        className="ltr-isolate"
                        style={{ fontSize: '12px', color: 'var(--text-faint)' }}
                      >
                        {wallet.userEmail}
                      </div>
                    </td>
                    <td>{format.currency(wallet.balanceCents)}</td>
                    <td>{format.number(wallet.transactionCount)}</td>
                    <td>{wallet.lastTransactionAt ? format.date(wallet.lastTransactionAt) : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="pill-btn"
                        onClick={() => void openDetail(wallet.userId)}
                      >
                        {t('admin.wallets.manage')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      {detail ? (
        <article className="admin-card">
          <div className="admin-section-head">
            <div>
              <h2>
                {t('admin.wallets.detailTitle')} — {detail.userName}
              </h2>
              <p>
                {t('admin.wallets.balance')}: {format.currency(detail.balanceCents)}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span className="admin-sub">{t('admin.wallets.type')}</span>
              <select
                className="admin-input"
                value={type}
                onChange={(e) => setType(e.target.value as 'CREDIT' | 'DEBIT')}
              >
                <option value="CREDIT">{t('admin.wallets.credit')}</option>
                <option value="DEBIT">{t('admin.wallets.debit')}</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span className="admin-sub">{t('admin.wallets.amount')}</span>
              <input
                className="admin-input ltr-isolate"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem', flex: '1 1 220px' }}>
              <span className="admin-sub">{t('admin.wallets.description')}</span>
              <input
                className="admin-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="cta-primary"
              onClick={() => void adjust()}
              disabled={busy || !amount.trim() || !description.trim()}
            >
              {busy ? <Loader2 size={16} className="spin" /> : null} {t('admin.wallets.apply')}
            </button>
          </div>
          <div className="admin-table-wrap" style={{ marginTop: '1rem' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.wallets.col.txnType')}</th>
                  <th>{t('admin.wallets.col.txnAmount')}</th>
                  <th>{t('admin.wallets.col.txnDesc')}</th>
                  <th>{t('admin.wallets.col.txnDate')}</th>
                </tr>
              </thead>
              <tbody>
                {detail.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4}>{t('admin.wallets.noTxns')}</td>
                  </tr>
                ) : (
                  detail.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <span className={`admin-badge${transaction.type === 'CREDIT' ? ' ok' : ''}`}>
                          {transaction.type === 'CREDIT'
                            ? t('admin.wallets.credit')
                            : t('admin.wallets.debit')}
                        </span>
                      </td>
                      <td>{format.currency(transaction.amountCents)}</td>
                      <td>{transaction.description}</td>
                      <td>{format.date(transaction.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </div>
  );
}