import { Module } from '@nestjs/common';
import { AdminAccessGuard } from '../common/guards/admin-access.guard';
import { ModeratorAccessService } from '../common/moderator-access.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService, ModeratorAccessService, RolesGuard, AdminAccessGuard],
  exports: [SiteSettingsService, ModeratorAccessService],
})
export class SiteSettingsModule {}
