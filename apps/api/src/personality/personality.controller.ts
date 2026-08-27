import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { AuthUser, PersonalityResult } from '@kia-academy/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { SubmitPersonalityDto } from './dto/submit-personality.dto';
import { PersonalityService } from './personality.service';

@Controller('personality')
@UseGuards(JwtAuthGuard, ProfileCompleteGuard)
export class PersonalityController {
  constructor(private readonly personalityService: PersonalityService) {}

  @Post()
  submit(
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitPersonalityDto,
  ): Promise<PersonalityResult> {
    return this.personalityService.submit(user.id, dto.answers);
  }

  @Get('latest')
  latest(@CurrentUser() user: AuthUser): Promise<PersonalityResult | null> {
    return this.personalityService.latestForUser(user.id);
  }
}
