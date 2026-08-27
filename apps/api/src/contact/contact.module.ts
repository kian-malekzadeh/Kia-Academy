import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [EmailModule, SiteSettingsModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
