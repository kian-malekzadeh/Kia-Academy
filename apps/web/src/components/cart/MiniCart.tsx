'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartProvider';
import { useLanguage } from '@/context/LanguageProvider';

interface MiniCartProps {
  onClose: () => void;
}

export function MiniCart({ onClose }: MiniCartProps) {
  const { t, format } = useLanguage();
  const { cart, loading } = useCart();
  const items = cart?.items ?? [];

  return (
    <div className="mini-cart" role="dialog" aria-label={t('cart.miniTitle')}>
      <div className="mini-cart-head">
        <b>{t('cart.miniTitle')}</b>
        <span>{t('cart.miniCount', { count: items.length })}</span>
      </div>

      {loading && !cart ? (
        <p className="mini-cart-empty">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="mini-cart-empty">{t('cart.empty')}</p>
      ) : (
        <ul className="mini-cart-list">
          {items.map((item) => (
            <li key={item.id} className="mini-cart-item">
              {/* <span className="mini-cart-thumb" aria-hidden="true">
                {item.thumbnail || '📘'}
              </span> */}
              <div className="mini-cart-item-body">
                <b>{item.title}</b>
                <span>{format.currency(item.finalPriceCents)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 ? (
        <div className="mini-cart-total">
          <span>{t('cart.total')}</span>
          <strong>{format.currency(cart?.totalCents ?? 0)}</strong>
        </div>
      ) : null}

      <div className="mini-cart-actions">
        <Link href="/cart" className="btn-outline-full" onClick={onClose}>
          {t('cart.miniView')}
        </Link>
        <Link
          href="/checkout?from=cart"
          className="cta-primary mini-cart-checkout"
          onClick={onClose}
        >
          {t('cart.checkout')}
        </Link>
      </div>
    </div>
  );
}
