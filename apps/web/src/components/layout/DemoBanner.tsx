'use client';

import { isDemoMode } from '@/lib/demoMode';

export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="demo-banner" role="status">
      Static demo on GitHub Pages — progress stays in this browser. Clone locally for the full API +
      database stack.
    </div>
  );
}
