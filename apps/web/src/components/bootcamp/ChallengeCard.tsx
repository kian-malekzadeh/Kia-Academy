'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

interface ChallengeCardProps {
  title: string;
  description: string;
  badge: string;
  badgeMuted?: boolean;
  points: string;
  footerLeft: string;
  initialSeconds?: number;
  disabled?: boolean;
  onClick?: () => void;
}

export function ChallengeCard({
  title,
  description,
  badge,
  badgeMuted,
  points,
  footerLeft,
  initialSeconds,
  disabled,
  onClick,
}: ChallengeCardProps) {
  const { t } = useLanguage();
  const [seconds, setSeconds] = useState(initialSeconds ?? 0);

  useEffect(() => {
    if (initialSeconds === undefined || disabled) return;
    setSeconds(initialSeconds);
    const id = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [initialSeconds, disabled]);

  const formatTimer = (totalSeconds: number): string => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return t('bootcamp.timerLeft', { h, m, s });
  };

  return (
    <div
      className="challenge-card"
      style={disabled ? { opacity: 0.55, cursor: 'default' } : undefined}
      onClick={disabled ? undefined : onClick}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === 'Enter') onClick?.();
            }
      }
    >
      <div className="cc-top">
        <span
          className="cc-badge"
          style={
            badgeMuted
              ? { background: 'var(--border-soft)', color: 'var(--text-faint)' }
              : undefined
          }
        >
          {badge}
        </span>
        {initialSeconds !== undefined && !disabled && (
          <span className="cc-timer">{formatTimer(seconds)}</span>
        )}
      </div>
      <div className="cc-title">{title}</div>
      <div className="cc-desc">{description}</div>
      <div className="cc-footer">
        <span>{footerLeft}</span>
        <span className="cc-points">{points}</span>
      </div>
    </div>
  );
}
