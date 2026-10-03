'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

type NavLeaf = {
  id: string;
  href: string;
  label: string;
  exact?: boolean;
  icon: LucideIcon;
};

function pathActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Sidebar sections of the learner panel — one flat entry each. Ticket creation
 * is deliberately not a nav item: `/dashboard/tickets` opens on the list and
 * carries the «+ تیکت جدید» button (also reachable from the dashboard ticket
 * card and from a course), so a «تیکت‌ها» submenu only duplicated it.
 *
 * The desktop sidebar's icon-only compact mode is pure CSS (`.panel-nav--compact`
 * hides `.learner-nav-text`), so no layout state is needed here.
 */
export function LearnerNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || '/dashboard';
  const { t } = useLanguage();

  const nav = useMemo((): NavLeaf[] => {
    return [
      {
        id: 'dashboard',
        href: '/dashboard',
        label: t('panel.nav.dashboard'),
        icon: LayoutDashboard,
        exact: true,
      },
      {
        id: 'my-courses',
        href: '/dashboard/my-courses',
        label: t('panel.nav.myCourses'),
        icon: BookOpen,
      },
      {
        id: 'tickets',
        href: '/dashboard/tickets',
        label: t('panel.nav.tickets'),
        icon: Ticket,
      },
      {
        id: 'messages',
        href: '/dashboard/messages',
        label: t('panel.nav.messages'),
        icon: MessageSquare,
      },
    ];
  }, [t]);

  return (
    <div className="learner-nav">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = pathActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`top-nav-link learner-nav-link${active ? ' is-active' : ''}`}
            title={item.label}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="learner-nav-text">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
