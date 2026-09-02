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
  AdminAdjustWalletDto,
  AdminCreateChallengeDto,
  AdminCreateCompetitionDto,
  AdminCreateCourseDto,
  AdminCreateLessonDto,
  AdminCreateRoleDto,
  AdminCreateUserDto,
  AdminGrantEntitlementDto,
  AdminReplyTicketDto,
  AdminSendMessageDto,
  AdminUpdateChallengeDto,
  AdminUpdateCompetitionDto,
  AdminUpdateCourseDto,
  AdminUpdateLessonDto,
  AdminUpdateRoleDto,
  AdminUpdateTicketDto,
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

  @Get('roles')
  @AdminAccess('users', 'view')
  listRoles() {
    return this.adminService.listRoles();
  }

  @Post('roles')
  @AdminAccess('users', 'manage')
  createRole(@Body() dto: AdminCreateRoleDto) {
    return this.adminService.createRole(dto);
  }

  @Patch('roles/:id')
  @AdminAccess('users', 'edit')
  updateRole(@Param('id') id: string, @Body() dto: AdminUpdateRoleDto) {
    return this.adminService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @AdminAccess('users', 'manage')
  deleteRole(@Param('id') id: string) {
    return this.adminService.deleteRole(id);
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

  /* --- Support tickets -------------------------------------------------------- */

  @Get('tickets')
  @AdminAccess('tickets', 'view')
  listTickets() {
    return this.adminService.listTickets();
  }

  @Get('tickets/:id')
  @AdminAccess('tickets', 'view')
  getTicket(@Param('id') id: string) {
    return this.adminService.getTicket(id);
  }

  @Post('tickets/:id/replies')
  @AdminAccess('tickets', 'edit')
  replyToTicket(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminReplyTicketDto,
  ) {
    return this.adminService.replyToTicket(id, dto, actor);
  }

  @Patch('tickets/:id')
  @AdminAccess('tickets', 'edit')
  updateTicket(@Param('id') id: string, @Body() dto: AdminUpdateTicketDto) {
    return this.adminService.updateTicket(id, dto);
  }

  /* --- Learner inbox messages --------------------------------------------------- */

  @Get('messages')
  @AdminAccess('messages', 'view')
  listMessages() {
    return this.adminService.listMessages();
  }

  @Post('messages')
  @AdminAccess('messages', 'manage')
  sendMessage(@CurrentUser() actor: AuthUser, @Body() dto: AdminSendMessageDto) {
    return this.adminService.sendMessage(dto, actor);
  }

  @Delete('messages/:id')
  @AdminAccess('messages', 'manage')
  deleteMessage(@Param('id') id: string) {
    return this.adminService.deleteMessage(id);
  }

  /* --- Competitions --------------------------------------------------------------- */

  @Get('competitions')
  @AdminAccess('competitions', 'view')
  listCompetitions() {
    return this.adminService.listCompetitions();
  }

  @Post('competitions')
  @AdminAccess('competitions', 'manage')
  createCompetition(@Body() dto: AdminCreateCompetitionDto) {
    return this.adminService.createCompetition(dto);
  }

  @Patch('competitions/:id')
  @AdminAccess('competitions', 'edit')
  updateCompetition(@Param('id') id: string, @Body() dto: AdminUpdateCompetitionDto) {
    return this.adminService.updateCompetition(id, dto);
  }

  @Delete('competitions/:id')
  @AdminAccess('competitions', 'manage')
  deleteCompetition(@Param('id') id: string) {
    return this.adminService.deleteCompetition(id);
  }

  @Get('competitions/:id/registrations')
  @AdminAccess('competitions', 'view')
  listCompetitionRegistrations(@Param('id') id: string) {
    return this.adminService.listCompetitionRegistrations(id);
  }

  /* --- Finance: orders / entitlements / wallets ------------------------------------- */

  @Get('orders')
  @AdminAccess('payments', 'view')
  listOrders() {
    return this.adminService.listOrders();
  }

  @Get('entitlements')
  @AdminAccess('payments', 'view')
  listEntitlements() {
    return this.adminService.listEntitlements();
  }

  @Post('entitlements')
  @AdminAccess('payments', 'manage')
  grantEntitlement(@Body() dto: AdminGrantEntitlementDto) {
    return this.adminService.grantEntitlement(dto);
  }

  @Delete('entitlements/:id')
  @AdminAccess('payments', 'manage')
  revokeEntitlement(@Param('id') id: string) {
    return this.adminService.revokeEntitlement(id);
  }

  @Get('wallets')
  @AdminAccess('payments', 'view')
  listWallets() {
    return this.adminService.listWallets();
  }

  @Get('wallets/:userId')
  @AdminAccess('payments', 'view')
  getWallet(@Param('userId') userId: string) {
    return this.adminService.getWallet(userId);
  }

  @Post('wallets/:userId/adjust')
  @AdminAccess('payments', 'manage')
  adjustWallet(@Param('userId') userId: string, @Body() dto: AdminAdjustWalletDto) {
    return this.adminService.adjustWallet(userId, dto);
  }
}
