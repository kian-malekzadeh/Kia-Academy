import { Module } from '@nestjs/common';
import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { AssessmentsModule } from '../assessments/assessments.module';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { RoadmapsController } from './roadmaps.controller';
import { RoadmapsService } from './roadmaps.service';

@Module({
  imports: [SiteSettingsModule, AssessmentsModule],
  controllers: [RoadmapsController],
  providers: [RoadmapsService, ProfileCompleteGuard],
  exports: [RoadmapsService],
})
export class RoadmapsModule {}
