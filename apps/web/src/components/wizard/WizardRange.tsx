'use client';

import type { ChangeEvent, CSSProperties } from 'react';

type RangeMode = 'progress' | 'centered';

interface WizardRangeProps {
  mode: RangeMode;
  min: number;
  max: number;
  value: number;
  ariaLabel: string;
  onChange: (value: number) => void;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function WizardRange({ mode, min, max, value, ariaLabel, onChange }: WizardRangeProps) {
  const span = max - min || 1;
  const position = clampPercent(((value - min) / span) * 100);
  const midpoint = 50;

  let trackBackground = 'var(--border)';
  let side: 'left' | 'center' | 'right' = 'center';

  if (mode === 'progress') {
    trackBackground = `linear-gradient(
      to right,
      var(--indigo) 0%,
      var(--indigo) ${position}%,
      var(--border) ${position}%,
      var(--border) 100%
    )`;
  } else if (position < midpoint) {
    side = 'left';
    trackBackground = `linear-gradient(
      to right,
      var(--border) 0%,
      var(--border) ${position}%,
      var(--teal) ${position}%,
      var(--teal) ${midpoint}%,
      var(--border) ${midpoint}%,
      var(--border) 100%
    )`;
  } else if (position > midpoint) {
    side = 'right';
    trackBackground = `linear-gradient(
      to right,
      var(--border) 0%,
      var(--border) ${midpoint}%,
      var(--indigo) ${midpoint}%,
      var(--indigo) ${position}%,
      var(--border) ${position}%,
      var(--border) 100%
    )`;
  }

  const wrapStyle = {
    '--range-position': `${position}%`,
    '--range-track': trackBackground,
  } as CSSProperties;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <div
      className={`wizard-range wizard-range--${mode}${mode === 'centered' ? ` wizard-range--${side}` : ''}`}
      style={wrapStyle}
    >
      <input
        type="range"
        className={mode === 'progress' ? 'progress-range' : 'centered-range'}
        min={min}
        max={max}
        value={value}
        aria-label={ariaLabel}
        data-side={mode === 'centered' ? side : undefined}
        onChange={handleChange}
      />
    </div>
  );
}
