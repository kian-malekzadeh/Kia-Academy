'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Coins,
  CreditCard,
  ClipboardList,
  LineChart,
  Menu,
  Settings,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  adminSectionAllowed,
  createDefaultSiteSettings,
  normalizeAdminAccess,
  type AdminAccessSection,
  type SiteAdminAccessSettings,
} from '@kia-academy/shared';
import { BrandMark } from '@/components/brand/BrandMark';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';

type AdminSection = AdminAccessSection;

type NavLeaf = {
  id: string;
  href: string;
  label: string;
  exact?: boolean;
  key: AdminSection;
};

type NavItem =
  | (NavLeaf & { icon: typeof BarChart3; children?: undefined })
  | {
      id: string;
      label: string;
      icon: typeof BarChart3;
      key: AdminSection;
      children: NavLeaf[];
    };

function pathActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  /** Skip the login gate while logging out via «بازگشت به سایت». */
  const leavingToSiteRef = useRef(false);

  const isSuper = user?.role === 'SUPER_ADMIN';
  const isStaff = user?.role === 'ADMIN' || isSuper;

  const access = useMemo((): SiteAdminAccessSettings | null => {
    if (!isStaff || isSuper) return null;
    if (user?.role === 'ADMIN' && user.adminPanelAccess) {
      return normalizeAdminAccess(user.adminPanelAccess);
    }
    return normalizeAdminAccess(createDefaultSiteSettings().adminAccess);
  }, [isStaff, isSuper, user]);

  useEffect(() => {
    if (loading || leavingToSiteRef.current) return;
    // Guests and learners both get the admin login gate (not the learner dashboard).
    if (!user || !isStaff) {
      router.replace('/login?next=/admin');
    }
  }, [user, loading, router, isStaff]);

  const handleBackToSite = async () => {
    leavingToSiteRef.current = true;
    await logout();
    router.replace('/');
  };

  const nav = useMemo((): NavItem[] => {
    const can = (key: AdminSection) => {
      if (isSuper) return true;
      if (!access) return false;
      return adminSectionAllowed(access, key, 'view');
    };

    const items: NavItem[] = [
      {
        id: 'dashboard',
        href: '/admin',
        label: t('admin.nav.stats'),
        icon: BarChart3,
        exact: true,
        key: 'stats',
      },
      {
        id: 'users',
        label: t('admin.nav.users'),
        icon: Users,
        key: 'users',
        children: [
          {
            id: 'users-list',
            href: '/admin/users',
            label: t('admin.nav.usersList'),
            exact: true,
            key: 'users',
          },
          {
            id: 'users-create',
            href: '/admin/users/create',
            label: t('admin.nav.usersCreate'),
            key: 'users',
          },
          {
            id: 'users-roles',
            href: '/admin/users/roles',
            label: t('admin.nav.usersRoles'),
            key: 'users',
          },
        ],
      },
      {
        id: 'courses',
        label: t('admin.nav.courses'),
        icon: BookOpen,
        key: 'courses',
        children: [
          {
            id: 'courses-list',
            href: '/admin/courses',
            label: t('admin.nav.coursesList'),
            exact: true,
            key: 'courses',
          },
          {
            id: 'courses-new',
            href: '/admin/courses/new',
            label: t('admin.nav.coursesNew'),
            key: 'courses',
          },
        ],
      },
      {
        id: 'challenges',
        href: '/admin/challenges',
        label: t('admin.nav.challenges'),
        icon: Trophy,
        key: 'challenges',
      },
      {
        id: 'tests',
        href: '/admin/tests',
        label: t('admin.nav.tests'),
        icon: ClipboardList,
        key: 'tests',
      },
      {
        id: 'finance',
        label: t('admin.nav.finance'),
        icon: Coins,
        key: 'payments',
        children: [
          {
            id: 'finance-revenue',
            href: '/admin/finance',
            label: t('admin.nav.financeRevenue'),
            exact: true,
            key: 'payments',
          },
          {
            id: 'finance-transactions',
            href: '/admin/payments',
            label: t('admin.nav.financeTransactions'),
            key: 'payments',
          },
        ],
      },
      {
        id: 'analytics',
        href: '/admin/analytics',
        label: t('admin.nav.analytics'),
        icon: LineChart,
        key: 'stats',
      },
      {
        id: 'settings',
        label: t('admin.nav.settings'),
        icon: Settings,
        key: 'settings',
        children: [
          {
            id: 'settings-general',
            href: '/admin/settings',
            label: t('admin.nav.settingsGeneral'),
            exact: true,
            key: 'settings',
          },
          {
            id: 'settings-contact',
            href: '/admin/contact',
            label: t('admin.nav.contact'),
            key: 'settings',
          },
        ],
      },
    ];

    return items
      .map((item) => {
        if ('children' in item && item.children) {
          const children = item.children.filter((child) => can(child.key));
          if (!children.length) return null;
          return { ...item, children };
        }
        return can(item.key) ? item : null;
      })
      .filter(Boolean) as NavItem[];
  }, [t, isSuper, access]);

  const flatLeaves = useMemo(() => {
    const leaves: NavLeaf[] = [];
    for (const item of nav) {
      if ('children' in item && item.children) leaves.push(...item.children);
      else leaves.push(item as NavLeaf);
    }
    return leaves;
  }, [nav]);

  useEffect(() => {
    if (isSuper || loading || !user || !access) return;
    const path = pathname || '/admin';
    const allowed =
      flatLeaves.some((item) => pathActive(path, item.href, item.exact)) ||
      path.startsWith('/admin/courses/') ||
      path.startsWith('/admin/users/') ||
      path.startsWith('/admin/finance') ||
      path.startsWith('/admin/analytics') ||
      path.startsWith('/admin/payments') ||
      path.startsWith('/admin/challenges') ||
      path.startsWith('/admin/tests') ||
      path.startsWith('/admin/contact') ||
      path.startsWith('/admin/settings');
    if (!allowed && path.startsWith('/admin')) {
      router.replace(flatLeaves[0]?.href ?? '/');
    }
  }, [access, isSuper, loading, user, pathname, flatLeaves, router]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const item of nav) {
      if ('children' in item && item.children) {
        const childHit = item.children.some((child) =>
          pathActive(pathname, child.href, child.exact),
        );
        const nestedHit =
          item.id === 'courses'
            ? pathname.startsWith('/admin/courses/')
            : item.id === 'users'
              ? pathname.startsWith('/admin/users/')
              : item.id === 'settings'
                ? pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/contact')
                : item.id === 'finance'
                  ? pathname.startsWith('/admin/finance') || pathname.startsWith('/admin/payments')
                  : false;
        if (childHit || nestedHit) next[item.id] = true;
      }
    }
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [pathname, nav]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const pageMeta = useMemo(() => {
    for (const item of nav) {
      if ('children' in item && item.children) {
        const child = item.children.find((c) => pathActive(pathname, c.href, c.exact));
        if (child) return { title: child.label, subtitle: t('admin.header.sub') };
      } else if (pathActive(pathname, item.href, item.exact)) {
        return { title: item.label, subtitle: t('admin.header.sub') };
      }
    }
    return { title: t('admin.sidebar'), subtitle: t('admin.header.sub') };
  }, [nav, pathname, t]);

  if (loading || !user || !isStaff) {
    return <div className="page-content auth-loading">{t('admin.checking')}</div>;
  }

  const roleLabel = isSuper ? t('domain.roles.superAdmin') : t('domain.roles.moderator');

  return (
    <div className={`admin-shell${sidebarOpen ? ' sidebar-open' : ''}`}>
      <button
        type="button"
        className="admin-menu-button"
        aria-label={t('admin.menu')}
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
      <div
        className="admin-sidebar-overlay"
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <aside className="admin-sidebar" aria-label={t('admin.sidebar')}>
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-mark">
            <BrandMark size={22} title="" />
          </span>
          <span>
            <strong>{t('admin.brand')}</strong>
            <small>{t('admin.brandSub')}</small>
          </span>
        </Link>
        <nav className="admin-nav">
          {nav.map((item) => {
            if ('children' in item && item.children) {
              const open = Boolean(openGroups[item.id]);
              const Icon = item.icon;
              return (
                <div key={item.id} className={`admin-nav-group${open ? ' open' : ''}`}>
                  <button
                    type="button"
                    className="admin-nav-group-toggle"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }))
                    }
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    <ChevronDown size={14} className="admin-nav-chevron" />
                  </button>
                  <div className="admin-nav-submenu">
                    <div>
                      {item.children.map((child) => {
                        const active = pathActive(pathname, child.href, child.exact);
                        return (
                          <Link
                            key={child.id}
                            href={child.href}
                            className={`admin-nav-link${active ? ' active' : ''}`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }
            const Icon = item.icon;
            const active = pathActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`admin-nav-link${active ? ' active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-profile">
          <span className="admin-brand-mark admin-brand-mark--profile">
            <BrandMark size={18} title="" />
          </span>
          <span className="profile">
            <strong>{user.name || user.email || t('admin.brand')}</strong>
            <small>{roleLabel}</small>
          </span>
          <span className="profile-status" title="online" />
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div className="page-title">
            <h1>{pageMeta.title}</h1>
            <p>{pageMeta.subtitle}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button type="button" className="admin-link" onClick={() => void handleBackToSite()}>
              {t('admin.backToSite')}
            </button>
            <span className="admin-badge info">
              <CreditCard size={12} />
              {roleLabel}
            </span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
