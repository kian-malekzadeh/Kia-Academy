import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AuthUser } from '@kia-academy/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { RoadmapsService } from './roadmaps.service';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';

@Controller('roadmaps')
@UseGuards(JwtAuthGuard, ProfileCompleteGuard)
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoadmapDto) {
    return this.roadmapsService.create(dto, user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.roadmapsService.findOne(id, user.id);
  }

  @Post(':id/enroll')
  enroll(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.roadmapsService.enroll(id, user.id);
  }
}
