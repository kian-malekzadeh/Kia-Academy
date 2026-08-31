'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Palette,
  Ticket,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageProvider';

type NavLeaf = {
  id: string;
  href: string;
  label: string;
  exact?: boolean;
};

type NavItem =
  | (NavLeaf & { icon: LucideIcon; children?: undefined })
  | {
      id: string;
      label: string;
      icon: LucideIcon;
      children: NavLeaf[];
    };

function pathActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LearnerNav({
  onNavigate,
  compact = false,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const pathname = usePathname() || '/dashboard';
  const { t } = useLanguage();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  // Icon-only compact mode applies to the desktop panel sidebar (>=901px)
  // only — the mobile top-nav sheet always keeps its labels.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const iconOnly = compact && isDesktop;

  const nav = useMemo((): NavItem[] => {
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
        label: t('panel.nav.tickets'),
        icon: Ticket,
        children: [
          {
            id: 'tickets-new',
            href: '/dashboard/tickets/new',
            label: t('panel.nav.newTicket'),
            exact: true,
          },
          {
            id: 'tickets-list',
            href: '/dashboard/tickets',
            label: t('panel.nav.previousTickets'),
            exact: true,
          },
        ],
      },
      {
        id: 'messages',
        href: '/dashboard/messages',
        label: t('panel.nav.messages'),
        icon: MessageSquare,
      },
      {
        id: 'profile',
        href: '/dashboard/profile',
        label: t('panel.nav.profile'),
        icon: UserRound,
      },
      {
        id: 'material',
        href: '/material',
        label: t('panel.nav.material'),
        icon: Palette,
      },
    ];
  }, [t]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const item of nav) {
      if (item.children) {
        const hit = item.children.some((child) => pathActive(pathname, child.href, child.exact));
        const nested =
          item.id === 'tickets' ? pathname.startsWith('/dashboard/tickets') : false;
        if (hit || nested) next[item.id] = true;
      }
    }
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [pathname, nav]);

  return (
    <div className="learner-nav">
      {nav.map((item) => {
        const Icon = item.icon;
        if (item.children) {
          const open = openGroups[item.id] ?? false;
          const groupActive = item.children.some((child) =>
            pathActive(pathname, child.href, child.exact),
          );
          // Icon-only sidebar: groups become a single icon link to their
          // active (or first) child — no expandable children.
          if (iconOnly) {
            const primary =
              item.children.find((child) => pathActive(pathname, child.href, child.exact)) ??
              item.children[0];
            if (!primary) return null;
            return (
              <Link
                key={item.id}
                href={primary.href}
                className={`top-nav-link learner-nav-link${groupActive ? ' is-active' : ''}`}
                title={item.label}
                aria-label={item.label}
                onClick={onNavigate}
              >
                <Icon size={16} aria-hidden="true" />
                <span className="learner-nav-text">{item.label}</span>
              </Link>
            );
          }
          return (
            <div
              key={item.id}
              className={`learner-nav-group${groupActive ? ' learner-nav-group--active' : ''}`}
            >
              <button
                type="button"
                className="learner-nav-group-btn"
                aria-expanded={open}
                onClick={() => setOpenGroups((prev) => ({ ...prev, [item.id]: !open }))}
              >
                <span className="learner-nav-label">
                  <Icon size={16} aria-hidden="true" />
                  <span className="learner-nav-text">{item.label}</span>
                </span>
                <ChevronDown
                  size={14}
                  className={`learner-nav-chevron${open ? ' learner-nav-chevron--open' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {open ? (
                <div className="learner-nav-children">
                  {item.children.map((child) => {
                    const active = pathActive(pathname, child.href, child.exact);
                    return (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`top-nav-link learner-nav-link${active ? ' is-active' : ''}`}
                        onClick={onNavigate}
                      >
                        <ClipboardList size={13} aria-hidden="true" />
                        <span className="learner-nav-text">{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        }

        const active = pathActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`top-nav-link learner-nav-link${active ? ' is-active' : ''}`}
            title={item.label}
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
