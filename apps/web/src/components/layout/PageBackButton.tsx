'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageProvider';

interface PageBackButtonProps {
  href: string;
  label?: string;
  className?: string;
}

/** Consistent back control that sits in document flow (never absolute/overlapping). */
export function PageBackButton({ href, label, className = '' }: PageBackButtonProps) {
  const { t } = useLanguage();
  return (
    <div className={`page-back-wrap ${className}`.trim()}>
      <Link href={href} className="page-back-btn">
        <ArrowLeft size={16} className="nav-arrow" aria-hidden />
        <span>{label ?? t('common.back')}</span>
      </Link>
    </div>
  );
}
