'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Menu, Shield, Trophy, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
import { CartBadge } from '@/components/cart/CartBadge';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { LearnerNav } from '@/components/layout/LearnerNav';
import { useApp } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { useLanguage } from '@/context/LanguageProvider';
import { useTheme } from '@/context/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function TopBar() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toggleTheme } = useTheme();
  const { hasRoadmap } = useApp();
  const { user, logout, loading } = useAuth();
  const { settings } = useSiteSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const topbarRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const handleLogoClick = () => {
    if (isSuperAdmin) {
      router.push('/admin');
      return;
    }
    router.push(hasRoadmap ? '/dashboard' : '/education');
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

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push('/');
  };

  const renderThemeToggle = () => (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={t('nav.toggleColorMode')}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        ◐
      </span>
      <span className="theme-toggle-label">{t('nav.mode')}</span>
    </button>
  );

  return (
    <div className="topbar" ref={topbarRef}>
      <div className="topbar-primary">
        <button type="button" className="logo" onClick={handleLogoClick}>
          <BrandMark className="logo-mark" size={26} title="" />
          <span className="logo-text">{settings.general.siteName || t('common.brand')}</span>
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
              <Shield size={14} /> {t('nav.admin')}
            </Link>
          ) : (
            <>
              <LearnerNav onNavigate={() => setNavOpen(false)} />
              {isAdmin && (
                <Link href="/admin" className="top-nav-link" onClick={() => setNavOpen(false)}>
                  <Shield size={14} /> {t('nav.admin')}
                </Link>
              )}
            </>
          )}

          {user && !isSuperAdmin ? (
            <Link href="/rewards" className="top-nav-link" onClick={() => setNavOpen(false)}>
              <Trophy size={14} aria-hidden="true" /> {t('nav.rewards')}
            </Link>
          ) : null}

          {user ? (
            <button
              type="button"
              className="top-nav-link danger"
              onClick={() => {
                setNavOpen(false);
                void handleLogout();
              }}
            >
              <LogOut size={14} aria-hidden="true" /> {t('nav.signOut')}
            </button>
          ) : null}

          <div className="top-nav-tools">
            <LanguageSelector />
            {renderThemeToggle()}
          </div>
        </nav>
      </div>

      <div className="topbar-secondary top-right">
        <div className="top-right-tools">
          <LanguageSelector />
          {renderThemeToggle()}
        </div>

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
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
