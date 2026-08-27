import { Module } from '@nestjs/common';
import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { TestBanksModule } from '../test-banks/test-banks.module';
import { PersonalityController } from './personality.controller';
import { PersonalityService } from './personality.service';

@Module({
  imports: [TestBanksModule],
  controllers: [PersonalityController],
  providers: [PersonalityService, ProfileCompleteGuard],
  exports: [PersonalityService],
})
export class PersonalityModule {}
