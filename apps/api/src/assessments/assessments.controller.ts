import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '@kia-academy/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';

@Controller('assessments')
@UseGuards(JwtAuthGuard, ProfileCompleteGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.create(dto, user.id);
  }

  @Get('latest')
  latest(@CurrentUser() user: AuthUser) {
    return this.assessmentsService.latestForUser(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.assessmentsService.findOne(id, user.id);
  }
}
