import { Module } from '@nestjs/common';
import { AdminAccessGuard } from '../common/guards/admin-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MediaModule } from '../media/media.module';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [MediaModule, SiteSettingsModule],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard, AdminAccessGuard],
})
export class AdminModule {}
