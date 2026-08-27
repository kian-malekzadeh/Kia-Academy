import { Module } from '@nestjs/common';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';

@Module({
  imports: [SiteSettingsModule],
  controllers: [ChallengesController],
  providers: [ChallengesService],
})
export class ChallengesModule {}
