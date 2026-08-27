import { Module } from '@nestjs/common';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { SmsProviderRegistry } from './providers/sms-provider.registry';
import { SmsService } from './sms.service';

@Module({
  imports: [SiteSettingsModule],
  providers: [SmsService, SmsProviderRegistry],
  exports: [SmsService],
})
export class SmsModule {}
