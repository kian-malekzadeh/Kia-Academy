import { Controller, Get, UseGuards } from '@nestjs/common';
import type { AuthUser, LearnerProgressSummary } from '@kia-academy/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProgressService } from './progress.service';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  getSummary(@CurrentUser() user: AuthUser): Promise<LearnerProgressSummary> {
    return this.progressService.getSummary(user.id);
  }
}
