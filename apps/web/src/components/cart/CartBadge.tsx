'use client';

import { ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MiniCart } from '@/components/cart/MiniCart';
import { useCart } from '@/context/CartProvider';
import { useLanguage } from '@/context/LanguageProvider';

export function CartBadge() {
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="cart-badge-wrap" ref={wrapRef}>
      <button
        type="button"
        className="cart-badge-btn"
        aria-label={t('cart.badge')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ShoppingCart size={18} aria-hidden="true" />
        {itemCount > 0 ? (
          <span className="cart-badge-count" aria-hidden="true">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        ) : null}
      </button>
      {open ? <MiniCart onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
