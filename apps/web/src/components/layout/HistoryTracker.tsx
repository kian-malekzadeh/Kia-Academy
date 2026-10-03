'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { trackHistoryEntry } from '@/lib/historyBack';

/**
 * Feeds every pathname change into the in-app history stack so back controls
 * know which page the user came from. Mounted once in `ClientProviders`.
 */
export function HistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) trackHistoryEntry(pathname);
  }, [pathname]);

  return null;
}