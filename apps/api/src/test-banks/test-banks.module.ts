import { Module } from '@nestjs/common';
import { AdminAccessGuard } from '../common/guards/admin-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { AdminTestBanksController } from './admin-test-banks.controller';
import { TestBanksController } from './test-banks.controller';
import { TestBanksService } from './test-banks.service';

@Module({
  imports: [SiteSettingsModule],
  controllers: [TestBanksController, AdminTestBanksController],
  providers: [TestBanksService, RolesGuard, AdminAccessGuard],
  exports: [TestBanksService],
})
export class TestBanksModule {}
