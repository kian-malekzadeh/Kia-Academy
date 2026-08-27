import { Module } from '@nestjs/common';
import { AdminCourseExamsController } from './admin-course-exams.controller';
import { CourseExamsController } from './course-exams.controller';
import { CourseExamsService } from './course-exams.service';

@Module({
  controllers: [CourseExamsController, AdminCourseExamsController],
  providers: [CourseExamsService],
  exports: [CourseExamsService],
})
export class CourseExamsModule {}

