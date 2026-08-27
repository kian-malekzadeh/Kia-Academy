import { Module } from '@nestjs/common';
import { AdminAccessGuard } from '../common/guards/admin-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [SiteSettingsModule],
  controllers: [MessagesController],
  providers: [MessagesService, RolesGuard, AdminAccessGuard],
})
export class MessagesModule {}
