'use client';

import { BrandMark } from '@/components/brand/BrandMark';

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  label: string;
  markSize?: number;
  showLabel?: boolean;
  as?: 'span' | 'div';
};

/** Brand mark + optional wordmark for headers, footers, and auth screens. */
export function BrandLogo({
  className = 'brand-logo',
  markClassName = 'brand-mark',
  textClassName = 'brand-logo-text',
  label,
  markSize,
  showLabel = true,
  as: Tag = 'span',
}: BrandLogoProps) {
  return (
    <Tag className={className}>
      <BrandMark className={markClassName} size={markSize} title={label} />
      {showLabel ? <span className={textClassName}>{label}</span> : null}
    </Tag>
  );
}
