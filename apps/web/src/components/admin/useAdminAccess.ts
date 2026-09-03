'use client';

import { useCallback, useMemo } from 'react';
import {
  adminSectionAllowed,
  createDefaultSiteSettings,
  normalizeAdminAccess,
  type AdminAccessSection,
  type AdminSectionPermission,
  type SiteAdminAccessSettings,
} from '@kia-academy/shared';
import { useAuth } from '@/context/AuthProvider';

/**
 * Single source of truth for the panel-side permission model.
 * SUPER_ADMIN sees everything; moderators are limited by their
 * adminPanelAccess matrix (defaulting to the site template).
 * NOTE: this only gates the UI — the API enforces the same rules.
 */
export function useAdminAccess(): {
  isSuper: boolean;
  isStaff: boolean;
  access: SiteAdminAccessSettings | null;
  can: (key: AdminAccessSection, level?: keyof AdminSectionPermission) => boolean;
} {
  const { user } = useAuth();

  const isSuper = user?.role === 'SUPER_ADMIN';
  const isStaff = user?.role === 'ADMIN' || isSuper;

  const access = useMemo((): SiteAdminAccessSettings | null => {
    if (!isStaff || isSuper) return null;
    if (user?.role === 'ADMIN' && user.adminPanelAccess) {
      return normalizeAdminAccess(user.adminPanelAccess);
    }
    return normalizeAdminAccess(createDefaultSiteSettings().adminAccess);
  }, [isStaff, isSuper, user]);

  const can = useCallback(
    (key: AdminAccessSection, level: keyof AdminSectionPermission = 'view') => {
      if (isSuper) return true;
      if (!access) return false;
      return adminSectionAllowed(access, key, level);
    },
    [isSuper, access],
  );

  return { isSuper, isStaff, access, can };
}
