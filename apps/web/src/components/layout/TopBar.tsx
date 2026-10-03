'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Menu, Moon, MoveHorizontal, Shield, Sun, Trophy, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { isStaffRole } from '@kia-academy/shared';
import { BRAND_WORDMARK, BrandMark } from '@/components/brand/BrandMark';
import { CartBadge } from '@/components/cart/CartBadge';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { LearnerNav } from '@/components/layout/LearnerNav';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTheme } from '@/context/ThemeProvider';
import { HOME_PATH } from '@/lib/postLoginPath';

/** Sidebar width presets — 'default' keeps the original 18.5rem panel width. */
type PanelNavSize = 'compact' | 'default' | 'wide';

const PANEL_NAV_SIZES: PanelNavSize[] = ['default', 'compact', 'wide'];
const PANEL_NAV_STORAGE_KEY = 'kia-panel-nav-size';

function isPanelNavSize(value: string | null): value is PanelNavSize {
  return value === 'compact' || value === 'default' || value === 'wide';
}

export function TopBar() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toggleTheme, theme } = useTheme();
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  // Sidebar size starts at the original default; the stored preference is
  // applied after mount so server and client markup stay identical.
  const [navSize, setNavSize] = useState<PanelNavSize>('default');
  const menuRef = useRef<HTMLDivElement>(null);
  const topbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PANEL_NAV_STORAGE_KEY);
      if (isPanelNavSize(stored)) setNavSize(stored);
    } catch {
      /* storage unavailable — keep default */
    }
  }, []);

  const cycleNavSize = () => {
    setNavSize((prev) => {
      const next =
        PANEL_NAV_SIZES[(PANEL_NAV_SIZES.indexOf(prev) + 1) % PANEL_NAV_SIZES.length];
      try {
        localStorage.setItem(PANEL_NAV_STORAGE_KEY, next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };


  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  // ADM-1: any non-learner role gets the admin-panel entry point.
  const isAdmin = !isSuperAdmin && isStaffRole(user?.role);

  const handleLogoClick = () => {
    if (isSuperAdmin) {
      router.push('/admin');
      return;
    }
    router.push(HOME_PATH);
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    if (!navOpen) return;

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node;
      if (topbarRef.current && !topbarRef.current.contains(target)) {
        setNavOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [navOpen]);

  /** Sign out lands on the landing page; `replace` keeps Back out of the session. */
  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace('/');
  };

  const navSizeClass =
    navSize === 'compact'
      ? ' panel-nav--compact'
      : navSize === 'wide'
        ? ' panel-nav--wide'
        : '';
  const navSizeLabel =
    navSize === 'compact'
      ? t('nav.menuSizeCompact')
      : navSize === 'wide'
        ? t('nav.menuSizeWide')
        : t('nav.menuSizeDefault');

  return (
    <div className={`topbar${navSizeClass}`} ref={topbarRef}>
      <div className="topbar-primary">
        {/* `aria-label` keeps the button named on mobile, where the wordmark is
            hidden and the mark alone would leave it unlabelled. */}
        <button
          type="button"
          className="logo"
          onClick={handleLogoClick}
          aria-label={BRAND_WORDMARK}
        >
          <BrandMark className="logo-mark" size={26} title="" />
          <span className="logo-text">{BRAND_WORDMARK}</span>
        </button>

        <button
          type="button"
          className="panel-nav-size-toggle"
          onClick={cycleNavSize}
          aria-label={t('nav.resizeMenu')}
          title={`${t('nav.resizeMenu')} — ${navSizeLabel}`}
        >
          <MoveHorizontal size={14} aria-hidden="true" />
          <span className="panel-nav-size-toggle-label">{navSizeLabel}</span>
        </button>

        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={t('nav.menu')}
          aria-expanded={navOpen}
          aria-controls="site-top-nav"
          onClick={() => setNavOpen((o) => !o)}
        >
          {navOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav id="site-top-nav" className={`top-nav${navOpen ? ' top-nav--open' : ''}`}>
          {isSuperAdmin ? (
            <Link href="/admin" className="top-nav-link" onClick={() => setNavOpen(false)}>
              <Shield size={14} />
              <span className="learner-nav-text">{t('nav.admin')}</span>
            </Link>
          ) : (
            <>
              <LearnerNav onNavigate={() => setNavOpen(false)} />
              {isAdmin && (
                <Link href="/admin" className="top-nav-link" onClick={() => setNavOpen(false)}>
                  <Shield size={14} />
                  <span className="learner-nav-text">{t('nav.admin')}</span>
                </Link>
              )}
            </>
          )}

          {user && !isSuperAdmin ? (
            <Link href="/rewards" className="top-nav-link" onClick={() => setNavOpen(false)}>
              <Trophy size={14} aria-hidden="true" />
              <span className="learner-nav-text">{t('nav.rewards')}</span>
            </Link>
          ) : null}

          {/* Sign out, color mode and language all live in the user menu
              (top-right), so the mobile sheet carries navigation only. */}
        </nav>
      </div>

      <div className="topbar-secondary top-right">
        {loading || !user ? null : (
          <>
            {!isSuperAdmin ? <CartBadge /> : null}
            <div className="user-menu-wrap" ref={menuRef}>
              <button
                type="button"
                className="user-chip"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
              >
                <span className="avatar" aria-hidden="true" />
                <span className="user-chip-name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>
              {menuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-head">
                    <b>{user.name}</b>
                    <span className="ltr-isolate">{user.email || user.phone}</span>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    className="user-dropdown-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserRound size={14} aria-hidden="true" />
                    <span>{t('panel.nav.profile')}</span>
                  </Link>

                  <div className="user-dropdown-sep" role="separator" />

                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={toggleTheme}
                    aria-label={t('nav.toggleColorMode')}
                  >
                    {theme === 'dark' ? (
                      <Moon size={14} aria-hidden="true" />
                    ) : (
                      <Sun size={14} aria-hidden="true" />
                    )}
                    <span>{t('nav.mode')}</span>
                    <span className="user-dropdown-value">
                      {theme === 'dark' ? t('nav.modeDark') : t('nav.modeLight')}
                    </span>
                  </button>

                  <LanguageSelector />

                  <div className="user-dropdown-sep" role="separator" />

                  <button
                    type="button"
                    className="user-dropdown-item danger"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleLogout();
                    }}
                  >
                    <LogOut size={14} aria-hidden="true" />
                    <span>{t('nav.signOut')}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
