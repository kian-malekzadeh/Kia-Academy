'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageProvider';
import type { ModalState } from '@/lib/storage';

interface ModalProps {
  modal: ModalState | null;
  onClose: () => void;
}

function launchConfetti(overlay: HTMLElement) {
  const colors = ['#6464ff', '#c4eed9', '#ffc864', '#8a8aff'];
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)]!;
    piece.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    overlay.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

export function Modal({ modal, onClose }: ModalProps) {
  const { t } = useLanguage();
  const overlayRef = useRef<HTMLDivElement>(null);
  const confettiLaunched = useRef(false);

  useEffect(() => {
    if (modal?.confetti && overlayRef.current && !confettiLaunched.current) {
      confettiLaunched.current = true;
      launchConfetti(overlayRef.current);
    }
    if (!modal) {
      confettiLaunched.current = false;
    }
  }, [modal]);

  if (!modal) return null;

  const handleClose = () => {
    modal.onClose?.();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return (
    <div
      ref={overlayRef}
      className="modal-overlay active"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="mi">{modal.icon}</div>
        <h4>{modal.title}</h4>
        <p>{modal.body}</p>
        <button type="button" onClick={handleClose}>
          {t('modal.continue')}
        </button>
      </div>
    </div>
  );
}
