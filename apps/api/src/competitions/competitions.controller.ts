import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser, CompetitionSummary } from '@kia-academy/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompetitionsService } from './competitions.service';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: AuthUser): Promise<CompetitionSummary[]> {
    return this.competitionsService.list(user.id);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthUser): Promise<CompetitionSummary[]> {
    return this.competitionsService.listRegistered(user.id);
  }

  @Post(':slug/register')
  @UseGuards(JwtAuthGuard)
  register(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
  ): Promise<CompetitionSummary> {
    return this.competitionsService.register(user.id, slug);
  }
}
