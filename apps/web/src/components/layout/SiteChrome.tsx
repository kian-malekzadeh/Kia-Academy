'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { Footer } from '@/components/layout/Footer';
import { SiteAurora } from '@/components/layout/SiteAurora';
import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/context/AuthProvider';

/**
 * Site chrome only after registration. Admin uses its own full-bleed shell.
 * Logged-in panel uses a desktop sidebar; mobile keeps the top bar sheet.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, learnerState, loading } = useAuth();
  const isAdminRoute = Boolean(pathname?.startsWith('/admin'));
  const registered = Boolean(user?.profileComplete || learnerState?.profileComplete);
  const showChrome = !loading && registered && !isAdminRoute;

  const main = (
    <main
      className={`site-main${showChrome ? '' : ' site-main--guest'}${isAdminRoute ? ' site-main--admin' : ''}`}
    >
      {children}
    </main>
  );

  return (
    <>
      {!isAdminRoute ? <SiteAurora /> : null}
      {!isAdminRoute ? <DemoBanner /> : null}
      {showChrome ? (
        <div className="panel-shell">
          <TopBar />
          <div className="panel-content">
            {main}
            <Footer />
          </div>
        </div>
      ) : (
        main
      )}
    </>
  );
}
