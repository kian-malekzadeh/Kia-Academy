import { Injectable } from '@nestjs/common';
import {
  adminSectionAllowed,
  normalizeAdminAccess,
  resolveModeratorAdminAccess,
  type AuthUser,
  type SiteAdminAccessSettings,
} from '@kia-academy/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';

@Injectable()
export class ModeratorAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siteSettings: SiteSettingsService,
  ) {}

  async getEffectiveAccess(user: AuthUser): Promise<SiteAdminAccessSettings | null> {
    if (user.role === 'SUPER_ADMIN') {
      return null;
    }
    if (user.role !== 'ADMIN') {
      return normalizeAdminAccess({});
    }
    const settings = await this.siteSettings.get();
    const row = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { adminPanelAccess: true },
    });
    return resolveModeratorAdminAccess(row?.adminPanelAccess, settings.adminAccess);
  }

  async assertAllowed(
    user: AuthUser,
    section: Parameters<typeof adminSectionAllowed>[1],
    level: Parameters<typeof adminSectionAllowed>[2] = 'view',
  ): Promise<boolean> {
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }
    const access = await this.getEffectiveAccess(user);
    if (!access) {
      return true;
    }
    return adminSectionAllowed(access, section, level);
  }
}
