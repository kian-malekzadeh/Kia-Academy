'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { canGoBackInApp } from '@/lib/historyBack';

interface BackLinkProps {
  /** Fallback target, used when the page was opened directly (no in-app history). */
  href: string;
  className?: string;
  children?: ReactNode;
  title?: string;
  'aria-label'?: string;
}

/**
 * Anchor that returns to the page the user came from. It stays a real link so
 * middle-click / open-in-new-tab and the no-JS case keep working, and only
 * intercepts the plain left click to reuse the browser history entry.
 */
export function BackLink({ href, className, children, ...rest }: BackLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    if (!canGoBackInApp()) return;
    event.preventDefault();
    router.back();
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}