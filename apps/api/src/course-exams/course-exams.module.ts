import { Module } from '@nestjs/common';
import { AdminAccessGuard } from '../common/guards/admin-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { AdminCourseExamsController } from './admin-course-exams.controller';
import { CourseExamsController } from './course-exams.controller';
import { CourseExamsService } from './course-exams.service';

@Module({
  imports: [SiteSettingsModule],
  controllers: [CourseExamsController, AdminCourseExamsController],
  providers: [CourseExamsService, RolesGuard, AdminAccessGuard],
  exports: [CourseExamsService],
})
export class CourseExamsModule {}

