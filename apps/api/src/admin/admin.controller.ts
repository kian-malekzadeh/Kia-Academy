import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { AuthUser } from '@kia-academy/shared';
import { AdminAccess } from '../common/decorators/admin-access.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminAccessGuard } from '../common/guards/admin-access.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MAX_LESSON_VIDEO_BYTES } from '../media/media-storage.service';
import { AdminService } from './admin.service';
import {
  AdminCreateChallengeDto,
  AdminCreateCourseDto,
  AdminCreateLessonDto,
  AdminCreateUserDto,
  AdminUpdateChallengeDto,
  AdminUpdateCourseDto,
  AdminUpdateLessonDto,
  AdminUpdateUserAccessDto,
  AdminUpdateUserRoleDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, AdminAccessGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @AdminAccess('stats', 'view')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('courses')
  @AdminAccess('courses', 'view')
  listCourses() {
    return this.adminService.listCourses();
  }

  @Post('courses')
  @AdminAccess('courses', 'manage')
  createCourse(@Body() dto: AdminCreateCourseDto) {
    return this.adminService.createCourse(dto);
  }

  @Patch('courses/:slug')
  @AdminAccess('courses', 'edit')
  updateCourse(@Param('slug') slug: string, @Body() dto: AdminUpdateCourseDto) {
    return this.adminService.updateCourse(slug, dto);
  }

  @Delete('courses/:slug')
  @AdminAccess('courses', 'manage')
  deleteCourse(@Param('slug') slug: string) {
    return this.adminService.deleteCourse(slug);
  }

  @Post('courses/:slug/lessons')
  @AdminAccess('courses', 'manage')
  createLesson(@Param('slug') slug: string, @Body() dto: AdminCreateLessonDto) {
    return this.adminService.createLesson(slug, dto);
  }

  @Patch('courses/:slug/lessons/:lessonSlug')
  @AdminAccess('courses', 'edit')
  updateLesson(
    @Param('slug') slug: string,
    @Param('lessonSlug') lessonSlug: string,
    @Body() dto: AdminUpdateLessonDto,
  ) {
    return this.adminService.updateLesson(slug, lessonSlug, dto);
  }

  @Delete('courses/:slug/lessons/:lessonSlug')
  @AdminAccess('courses', 'manage')
  deleteLesson(@Param('slug') slug: string, @Param('lessonSlug') lessonSlug: string) {
    return this.adminService.deleteLesson(slug, lessonSlug);
  }

  @Post('courses/:slug/lessons/:lessonSlug/video')
  @AdminAccess('courses', 'edit')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_LESSON_VIDEO_BYTES },
    }),
  )
  uploadLessonVideo(
    @Param('slug') slug: string,
    @Param('lessonSlug') lessonSlug: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminService.uploadLessonVideo(slug, lessonSlug, file);
  }

  @Delete('courses/:slug/lessons/:lessonSlug/video')
  @AdminAccess('courses', 'edit')
  deleteLessonVideo(@Param('slug') slug: string, @Param('lessonSlug') lessonSlug: string) {
    return this.adminService.deleteLessonVideo(slug, lessonSlug);
  }

  @Get('challenges')
  @AdminAccess('challenges', 'view')
  listChallenges() {
    return this.adminService.listChallenges();
  }

  @Post('challenges')
  @AdminAccess('challenges', 'manage')
  createChallenge(@Body() dto: AdminCreateChallengeDto) {
    return this.adminService.createChallenge(dto);
  }

  @Patch('challenges/:slug')
  @AdminAccess('challenges', 'edit')
  updateChallenge(@Param('slug') slug: string, @Body() dto: AdminUpdateChallengeDto) {
    return this.adminService.updateChallenge(slug, dto);
  }

  @Delete('challenges/:slug')
  @AdminAccess('challenges', 'manage')
  deleteChallenge(@Param('slug') slug: string) {
    return this.adminService.deleteChallenge(slug);
  }

  @Get('users')
  @AdminAccess('users', 'view')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Post('users')
  @AdminAccess('users', 'manage')
  createUser(@CurrentUser() actor: AuthUser, @Body() dto: AdminCreateUserDto) {
    return this.adminService.createUser(dto, actor);
  }

  @Patch('users/:id/role')
  @AdminAccess('users', 'edit')
  updateUserRole(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(id, dto, actor);
  }

  @Patch('users/:id/access')
  @AdminAccess('users', 'edit')
  updateUserAccess(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserAccessDto,
  ) {
    return this.adminService.updateUserAdminAccess(id, dto, actor);
  }

  @Get('contact')
  @AdminAccess('settings', 'view')
  listContactMessages() {
    return this.adminService.listContactMessages();
  }

  @Patch('contact/:id/read')
  @AdminAccess('settings', 'edit')
  markContactMessageRead(@Param('id') id: string) {
    return this.adminService.markContactMessageRead(id);
  }

  @Get('payments')
  @AdminAccess('payments', 'view')
  listPayments() {
    return this.adminService.listPayments();
  }
}
