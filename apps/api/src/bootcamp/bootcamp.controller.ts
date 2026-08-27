import { Controller, Get, UseGuards } from '@nestjs/common';
import type { AuthUser } from '@kia-academy/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BootcampService } from './bootcamp.service';

@Controller('bootcamp')
export class BootcampController {
  constructor(private readonly bootcampService: BootcampService) {}

  @Get('leaderboard')
  getLeaderboard() {
    return this.bootcampService.getLeaderboard();
  }

  @Get('state')
  @UseGuards(JwtAuthGuard)
  getState(@CurrentUser() user: AuthUser) {
    return this.bootcampService.getState(user.id);
  }
}
