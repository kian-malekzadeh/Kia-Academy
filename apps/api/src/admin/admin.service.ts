import { ConflictException, ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type {
  AdminChallenge,
  AdminContactMessage,
  AdminCourse,
  AdminLesson,
  AdminPayment,
  AdminRole,
  AdminStats,
  AdminUser,
  AuthUser,
  SiteAdminAccessSettings,
} from '@kia-academy/shared';
import {
  defaultExamBanks,
  genericExamQuestions,
  normalizeAdminAccess,
  normalizeIranianPhone,
} from '@kia-academy/shared';
import * as bcrypt from 'bcrypt';
import { MediaStorageService } from '../media/media-storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import {
  AdminCreateChallengeDto,
  AdminCreateCourseDto,
  AdminCreateLessonDto,
  AdminCreateRoleDto,
  AdminCreateUserDto,
  AdminUpdateChallengeDto,
  AdminUpdateCourseDto,
  AdminUpdateLessonDto,
  AdminUpdateRoleDto,
  AdminUpdateUserAccessDto,
  AdminUpdateUserRoleDto,
} from './dto/admin.dto';
import { Prisma } from '@prisma/client';

const BCRYPT_ROUNDS = 12;

const SYSTEM_ROLE_DEFS = [
  { key: 'LEARNER', isSystem: true },
  { key: 'ADMIN', isSystem: true },
  { key: 'SUPER_ADMIN', isSystem: true },
] as const;

/** Custom roles are moderator-like: panel access is decided by their access matrix. */
const isStaffRole = (role: string): boolean =>
  role === 'ADMIN' || (role !== 'LEARNER' && role !== 'SUPER_ADMIN');

function toJsonAccess(value: SiteAdminAccessSettings): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage: MediaStorageService,
    private readonly siteSettings: SiteSettingsService,
  ) {}

  async getStats(): Promise<AdminStats> {
    const [users, courses, lessons, challenges, activeChallenges, payments, enrollments, revenue] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.course.count(),
        this.prisma.lesson.count(),
        this.prisma.challenge.count(),
        this.prisma.challenge.count({ where: { active: true } }),
        this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
        this.prisma.enrollment.count(),
        this.prisma.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amountCents: true },
        }),
      ]);

    return {
      users,
      courses,
      lessons,
      enrollments,
      payments,
      revenueCents: revenue._sum.amountCents ?? 0,
      challenges,
      activeChallenges,
    };
  }

  async listCourses(): Promise<AdminCourse[]> {
    const courses = await this.prisma.course.findMany({
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return courses.map((course) => this.toAdminCourse(course));
  }

  async createCourse(dto: AdminCreateCourseDto): Promise<AdminCourse> {
    const existing = await this.prisma.course.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Course slug "${dto.slug}" already exists`);
    }

    const course = await this.prisma.course.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        icon: dto.icon ?? 'book',
        trackKey: dto.trackKey ?? null,
        sortOrder: dto.sortOrder ?? 0,
        published: dto.published ?? true,
        comingSoon: dto.comingSoon ?? false,
        lessons: dto.lessons?.length
          ? {
              create: dto.lessons.map((lesson, index) => ({
                slug: lesson.slug,
                title: lesson.title,
                content: lesson.content,
                durationMin: lesson.durationMin ?? 10,
                sortOrder: lesson.sortOrder ?? index + 1,
                comingSoon: lesson.comingSoon ?? false,
              })),
            }
          : undefined,
      },
      include: { lessons: { orderBy: { sortOrder: 'asc' } } },
    });

    // Default midterm + final exam for every new course.
    const anchorLesson = course.lessons[1] ?? course.lessons[0] ?? null;
    const bank = defaultExamBanks[dto.slug];
    const defaultExams = [
      {
        kind: 'MIDTERM' as const,
        title: `آزمون میان‌دوره ${course.title}`,
        description: 'سنجش نیمهٔ اول دوره — به‌صورت پیش‌فرض ساخته شد.',
        passScore: 50,
        sortOrder: 0,
        afterLessonId: anchorLesson?.id ?? null,
        questions: bank?.midterm ?? genericExamQuestions(course.title),
      },
      {
        kind: 'FINAL' as const,
        title: `آزمون نهایی ${course.title}`,
        description: 'پوشش کل دوره — به‌صورت پیش‌فرض ساخته شد.',
        passScore: 60,
        sortOrder: 1,
        afterLessonId: null,
        questions: bank?.final ?? genericExamQuestions(course.title),
      },
    ];
    for (const exam of defaultExams) {
      await this.prisma.courseExam.create({
        data: {
          courseId: course.id,
          title: exam.title,
          description: exam.description,
          passScore: exam.passScore,
          durationMin: 10,
          published: true,
          sortOrder: exam.sortOrder,
          kind: exam.kind,
          afterLessonId: exam.afterLessonId,
          questions: JSON.stringify(exam.questions),
        },
      });
    }

    return this.toAdminCourse(course);
  }

  async updateCourse(slug: string, dto: AdminUpdateCourseDto): Promise<AdminCourse> {
    const course = await this.ensureCourseBySlug(slug);

    if (dto.slug && dto.slug !== course.slug) {
      const conflict = await this.prisma.course.findFirst({
        where: { slug: dto.slug, NOT: { id: course.id } },
      });
      if (conflict) {
        throw new ConflictException(`Course slug "${dto.slug}" already exists`);
      }
    }

    const updated = await this.prisma.course.update({
      where: { id: course.id },
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        icon: dto.icon,
        trackKey: dto.trackKey,
        sortOrder: dto.sortOrder,
        published: dto.published,
        comingSoon: dto.comingSoon,
      },
      include: { lessons: { orderBy: { sortOrder: 'asc' } } },
    });

    return this.toAdminCourse(updated);
  }

  async deleteCourse(slug: string): Promise<{ deleted: true }> {
    const course = await this.ensureCourseBySlug(slug);
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId: course.id },
      select: { id: true, videoUrl: true },
    });
    for (const lesson of lessons) {
      this.mediaStorage.deleteByPublicUrl(lesson.videoUrl);
      this.mediaStorage.clearLessonDir(lesson.id);
    }
    await this.prisma.course.delete({ where: { id: course.id } });
    return { deleted: true };
  }

  async createLesson(courseSlug: string, dto: AdminCreateLessonDto): Promise<AdminLesson> {
    const course = await this.ensureCourseBySlug(courseSlug);

    const conflict = await this.prisma.lesson.findFirst({
      where: { courseId: course.id, slug: dto.slug },
    });
    if (conflict) {
      throw new ConflictException(`Lesson slug "${dto.slug}" already exists in this course`);
    }

    const maxOrder = await this.prisma.lesson.aggregate({
      where: { courseId: course.id },
      _max: { sortOrder: true },
    });

    const lesson = await this.prisma.lesson.create({
      data: {
        courseId: course.id,
        slug: dto.slug,
        title: dto.title,
        content: dto.content,
        durationMin: dto.durationMin ?? 10,
        sortOrder: dto.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
        comingSoon: dto.comingSoon ?? false,
      },
    });

    return this.toAdminLesson(lesson);
  }

  async updateLesson(
    courseSlug: string,
    lessonSlug: string,
    dto: AdminUpdateLessonDto,
  ): Promise<AdminLesson> {
    const course = await this.ensureCourseBySlug(courseSlug);
    const lesson = await this.prisma.lesson.findFirst({
      where: { courseId: course.id, slug: lessonSlug },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonSlug} not found in course ${courseSlug}`);
    }

    if (dto.slug && dto.slug !== lesson.slug) {
      const conflict = await this.prisma.lesson.findFirst({
        where: { courseId: course.id, slug: dto.slug, NOT: { id: lesson.id } },
      });
      if (conflict) {
        throw new ConflictException(`Lesson slug "${dto.slug}" already exists in this course`);
      }
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        slug: dto.slug,
        title: dto.title,
        content: dto.content,
        durationMin: dto.durationMin,
        sortOrder: dto.sortOrder,
        comingSoon: dto.comingSoon,
      },
    });

    return this.toAdminLesson(updated);
  }

  async deleteLesson(courseSlug: string, lessonSlug: string): Promise<{ deleted: true }> {
    const course = await this.ensureCourseBySlug(courseSlug);
    const lesson = await this.prisma.lesson.findFirst({
      where: { courseId: course.id, slug: lessonSlug },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonSlug} not found in course ${courseSlug}`);
    }
    this.mediaStorage.deleteByPublicUrl(lesson.videoUrl);
    this.mediaStorage.clearLessonDir(lesson.id);
    await this.prisma.lesson.delete({ where: { id: lesson.id } });
    return { deleted: true };
  }

  async uploadLessonVideo(
    courseSlug: string,
    lessonSlug: string,
    file: Express.Multer.File,
  ): Promise<AdminLesson> {
    const course = await this.ensureCourseBySlug(courseSlug);
    const lesson = await this.prisma.lesson.findFirst({
      where: { courseId: course.id, slug: lessonSlug },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonSlug} not found in course ${courseSlug}`);
    }

    this.mediaStorage.deleteByPublicUrl(lesson.videoUrl);
    const videoUrl = this.mediaStorage.saveLessonVideo(lesson.id, file);
    const updated = await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: { videoUrl },
    });
    return this.toAdminLesson(updated);
  }

  async deleteLessonVideo(courseSlug: string, lessonSlug: string): Promise<AdminLesson> {
    const course = await this.ensureCourseBySlug(courseSlug);
    const lesson = await this.prisma.lesson.findFirst({
      where: { courseId: course.id, slug: lessonSlug },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonSlug} not found in course ${courseSlug}`);
    }

    this.mediaStorage.deleteByPublicUrl(lesson.videoUrl);
    this.mediaStorage.clearLessonDir(lesson.id);
    const updated = await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: { videoUrl: null },
    });
    return this.toAdminLesson(updated);
  }

  async listChallenges(): Promise<AdminChallenge[]> {
    const challenges = await this.prisma.challenge.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return challenges.map((challenge) => this.toAdminChallenge(challenge));
  }

  async createChallenge(dto: AdminCreateChallengeDto): Promise<AdminChallenge> {
    const existing = await this.prisma.challenge.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Challenge slug "${dto.slug}" already exists`);
    }

    const challenge = await this.prisma.challenge.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        points: dto.points ?? 120,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        active: dto.active ?? true,
        starterCode: dto.starterCode ?? '',
      },
    });

    return this.toAdminChallenge(challenge);
  }

  async updateChallenge(slug: string, dto: AdminUpdateChallengeDto): Promise<AdminChallenge> {
    const challenge = await this.ensureChallengeBySlug(slug);

    if (dto.slug && dto.slug !== challenge.slug) {
      const conflict = await this.prisma.challenge.findFirst({
        where: { slug: dto.slug, NOT: { id: challenge.id } },
      });
      if (conflict) {
        throw new ConflictException(`Challenge slug "${dto.slug}" already exists`);
      }
    }

    const updated = await this.prisma.challenge.update({
      where: { id: challenge.id },
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        points: dto.points,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        active: dto.active,
        starterCode: dto.starterCode,
      },
    });

    return this.toAdminChallenge(updated);
  }

  async deleteChallenge(slug: string): Promise<{ deleted: true }> {
    const challenge = await this.ensureChallengeBySlug(slug);
    await this.prisma.challenge.delete({ where: { id: challenge.id } });
    return { deleted: true };
  }

  async listUsers(): Promise<AdminUser[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        adminPanelAccess: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      adminPanelAccess:
        isStaffRole(user.role) && user.role !== 'SUPER_ADMIN'
          ? normalizeAdminAccess(user.adminPanelAccess)
          : null,
    }));
  }

  async createUser(dto: AdminCreateUserDto, actor: AuthUser): Promise<AdminUser> {
    const email = dto.email.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new BadRequestException('Invalid email');
    }
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const role = dto.role ?? 'LEARNER';
    if (role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only super admins can create super-admin accounts');
    }

    // Custom roles must exist before they can be assigned.
    let customRoleAccess: SiteAdminAccessSettings | null = null;
    if (role !== 'LEARNER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      const customRole = await this.prisma.role.findUnique({ where: { key: role } });
      if (!customRole) {
        throw new BadRequestException(`Role "${role}" does not exist`);
      }
      customRoleAccess = customRole.access ? normalizeAdminAccess(customRole.access) : null;
    }

    let phone: string | null = null;
    if (dto.phone?.trim()) {
      phone = normalizeIranianPhone(dto.phone.trim());
      if (!phone) {
        throw new BadRequestException('Invalid Iranian phone number');
      }
    }

    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }
    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new ConflictException('Phone already registered');
      }
    }

    const settings = await this.siteSettings.get();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const name = dto.name.trim();

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role,
        profileComplete: true,
        emailVerified: true,
        adminPanelAccess:
          role === 'ADMIN'
            ? toJsonAccess(settings.adminAccess)
            : customRoleAccess
              ? toJsonAccess(customRoleAccess)
              : undefined,
        bootcampProfile: {
          create: {
            rank: settings.bootcamp.defaultRank,
            points: settings.bootcamp.defaultPoints,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        adminPanelAccess: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      adminPanelAccess:
        isStaffRole(user.role) && user.role !== 'SUPER_ADMIN'
          ? normalizeAdminAccess(user.adminPanelAccess)
          : null,
    };
  }

  async listRoles(): Promise<AdminRole[]> {
    const settings = await this.siteSettings.get();
    const custom = await this.prisma.role.findMany({ orderBy: { createdAt: 'asc' } });

    const systemRoles: AdminRole[] = SYSTEM_ROLE_DEFS.map((def) => ({
      id: def.key,
      key: def.key,
      name: def.key,
      isSystem: true,
      access:
        def.key === 'ADMIN'
          ? normalizeAdminAccess(settings.adminAccess)
          : def.key === 'SUPER_ADMIN'
            ? null
            : normalizeAdminAccess({}),
    }));

    return [
      ...systemRoles,
      ...custom.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        isSystem: role.isSystem,
        access: role.access ? normalizeAdminAccess(role.access) : null,
      })),
    ];
  }

  async createRole(dto: AdminCreateRoleDto): Promise<AdminRole> {
    const key = dto.key.trim();
    if (!key) {
      throw new BadRequestException('Role key is required');
    }
    if (SYSTEM_ROLE_DEFS.some((def) => def.key === key)) {
      throw new ConflictException(`Role "${key}" is a built-in system role`);
    }

    const existing = await this.prisma.role.findUnique({ where: { key } });
    if (existing) {
      throw new ConflictException(`Role key "${key}" already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        key,
        name: dto.name.trim() || key,
        isSystem: false,
        access: dto.access ? toJsonAccess(normalizeAdminAccess(dto.access)) : undefined,
      },
    });

    return {
      id: role.id,
      key: role.key,
      name: role.name,
      isSystem: role.isSystem,
      access: role.access ? normalizeAdminAccess(role.access) : null,
    };
  }

  async updateRole(id: string, dto: AdminUpdateRoleDto): Promise<AdminRole> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be edited');
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() || role.name : role.name,
        access:
          dto.access !== undefined
            ? toJsonAccess(normalizeAdminAccess(dto.access))
            : role.access === null
              ? Prisma.DbNull
              : (role.access as Prisma.InputJsonValue),
      },
    });

    return {
      id: updated.id,
      key: updated.key,
      name: updated.name,
      isSystem: updated.isSystem,
      access: updated.access ? normalizeAdminAccess(updated.access) : null,
    };
  }

  async deleteRole(id: string): Promise<{ deleted: true }> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    const inUse = await this.prisma.user.count({ where: { role: role.key } });
    if (inUse > 0) {
      throw new ConflictException(
        `Role "${role.key}" is assigned to ${inUse} user(s) — reassign them first`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    return { deleted: true };
  }

  async updateUserRole(
    id: string,
    dto: AdminUpdateUserRoleDto,
    actor: AuthUser,
  ): Promise<AdminUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (actor.role !== 'SUPER_ADMIN') {
      if (dto.role === 'SUPER_ADMIN' || user.role === 'SUPER_ADMIN') {
        throw new ForbiddenException('Only super admins can manage super-admin roles');
      }
    }

    if (user.role === 'SUPER_ADMIN' && dto.role !== 'SUPER_ADMIN') {
      const superCount = await this.prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
      if (superCount <= 1) {
        throw new ForbiddenException('Cannot demote the last super admin');
      }
    }

    // Resolve the requested role: system roles are built-in, anything else must
    // exist as a custom Role record.
    let customRoleAccess: SiteAdminAccessSettings | null = null;
    if (!SYSTEM_ROLE_DEFS.some((def) => def.key === dto.role)) {
      const customRole = await this.prisma.role.findUnique({ where: { key: dto.role } });
      if (!customRole) {
        throw new BadRequestException(`Role "${dto.role}" does not exist`);
      }
      customRoleAccess = customRole.access ? normalizeAdminAccess(customRole.access) : null;
    }

    const settings = await this.siteSettings.get();
    const roleData: Prisma.UserUpdateInput = { role: dto.role };

    if (dto.role === 'ADMIN') {
      roleData.adminPanelAccess =
        (user.adminPanelAccess as Prisma.InputJsonValue | null) ??
        toJsonAccess(settings.adminAccess);
    } else if (customRoleAccess) {
      roleData.adminPanelAccess = toJsonAccess(customRoleAccess);
    } else {
      roleData.adminPanelAccess = Prisma.DbNull;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: roleData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        adminPanelAccess: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
      adminPanelAccess:
        updated.role === 'ADMIN' || isStaffRole(updated.role)
          ? normalizeAdminAccess(updated.adminPanelAccess)
          : null,
    };
  }

  async updateUserAdminAccess(
    id: string,
    dto: AdminUpdateUserAccessDto,
    actor: AuthUser,
  ): Promise<AdminUser> {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only super admins can configure moderator access');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    if (user.role !== 'ADMIN' && !isStaffRole(user.role)) {
      throw new BadRequestException('Panel access applies to moderator accounts only');
    }

    const adminPanelAccess = normalizeAdminAccess(dto.adminPanelAccess);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { adminPanelAccess: toJsonAccess(adminPanelAccess) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        adminPanelAccess: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
      adminPanelAccess: normalizeAdminAccess(updated.adminPanelAccess),
    };
  }

  async listContactMessages(): Promise<AdminContactMessage[]> {
    const messages = await this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return messages.map((msg) => ({
      id: msg.id,
      name: msg.name,
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
      readAt: msg.readAt?.toISOString() ?? null,
      createdAt: msg.createdAt.toISOString(),
    }));
  }

  async markContactMessageRead(id: string): Promise<AdminContactMessage> {
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Contact message ${id} not found`);
    }
    const updated = await this.prisma.contactMessage.update({
      where: { id },
      data: { readAt: existing.readAt ?? new Date() },
    });
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      subject: updated.subject,
      message: updated.message,
      readAt: updated.readAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async listPayments(): Promise<AdminPayment[]> {
    const payments = await this.prisma.payment.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return payments.map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      userEmail: p.user.email,
      productType: p.productType,
      productRef: p.productRef,
      amountCents: p.amountCents,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  private async ensureCourseBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({ where: { slug } });
    if (!course) {
      throw new NotFoundException(`Course ${slug} not found`);
    }
    return course;
  }

  private async ensureChallengeBySlug(slug: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { slug },
    });
    if (!challenge) {
      throw new NotFoundException(`Challenge ${slug} not found`);
    }
    return challenge;
  }

  private toAdminLesson(lesson: {
    id: string;
    slug: string;
    title: string;
    content: string;
    videoUrl?: string | null;
    durationMin: number;
    sortOrder: number;
    comingSoon?: boolean;
  }): AdminLesson {
    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl ?? null,
      durationMin: lesson.durationMin,
      sortOrder: lesson.sortOrder,
      comingSoon: lesson.comingSoon ?? false,
    };
  }

  private toAdminCourse(course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string;
    trackKey: string | null;
    sortOrder: number;
    published: boolean;
    comingSoon?: boolean;
    lessons: Array<{
      id: string;
      slug: string;
      title: string;
      content: string;
      videoUrl?: string | null;
      durationMin: number;
      sortOrder: number;
    }>;
  }): AdminCourse {
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      icon: course.icon,
      trackKey: course.trackKey,
      sortOrder: course.sortOrder,
      published: course.published,
      comingSoon: course.comingSoon ?? false,
      lessonCount: course.lessons.length,
      lessons: course.lessons.map((lesson) => this.toAdminLesson(lesson)),
    };
  }

  private toAdminChallenge(challenge: {
    id: string;
    slug: string;
    title: string;
    description: string;
    points: number;
    startsAt: Date;
    endsAt: Date;
    active: boolean;
    starterCode: string;
  }): AdminChallenge {
    return {
      id: challenge.id,
      slug: challenge.slug,
      title: challenge.title,
      description: challenge.description,
      points: challenge.points,
      startsAt: challenge.startsAt.toISOString(),
      endsAt: challenge.endsAt.toISOString(),
      active: challenge.active,
      starterCode: challenge.starterCode,
    };
  }
}
