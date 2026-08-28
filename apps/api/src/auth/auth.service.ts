import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerException } from '@nestjs/throttler';
import type {
  AuthResponse,
  AuthTokens,
  AuthUser,
  CompleteProfileDto,
  LearnerState,
  ProfileDetails,
  RequestOtpResponse,
} from '@kia-academy/shared';
import {
  containsUnsafeText,
  isValidEmail,
  isValidIranCity,
  isValidIranProvince,
  normalizeAdminAccess,
  normalizeIranianPhone,
  resolveModeratorAdminAccess,
  sanitizeProfileText,
} from '@kia-academy/shared';
import * as bcrypt from 'bcrypt';
import { createHash, randomInt, randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import { SmsService } from '../sms/sms.service';
import { sniffImageMime } from '../common/utils/image-sniff';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { addDurationToDate, parseExpiresInSeconds } from './auth.utils';

const BCRYPT_ROUNDS = 12;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
/** Per-phone SMS-bomb protection: max codes generated per window regardless of IP. */
const OTP_PHONE_WINDOW_MS = 10 * 60 * 1000;
const OTP_MAX_PER_PHONE = 3;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly siteSettings: SiteSettingsService,
    private readonly smsService: SmsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse & { refreshToken: string }> {
    const email = dto.email.toLowerCase();
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }
    if (!isValidIranProvince(dto.province) || !isValidIranCity(dto.province, dto.city)) {
      throw new BadRequestException('Invalid province or city');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const settings = await this.siteSettings.get();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const province = sanitizeProfileText(dto.province);
    const city = sanitizeProfileText(dto.city);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        passwordHash,
        province,
        city,
        profileComplete: true,
        bootcampProfile: {
          create: {
            rank: settings.bootcamp.defaultRank,
            points: settings.bootcamp.defaultPoints,
          },
        },
      },
    });

    await this.emailService.sendWelcome({
      id: user.id,
      name: user.name,
      email: user.email ?? email,
    });

    return this.issueAuthResponse(await this.buildAuthUser(user));
  }

  async login(dto: LoginDto): Promise<AuthResponse & { refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueAuthResponse(await this.buildAuthUser(user));
  }

  async requestOtp(rawPhone: string): Promise<RequestOtpResponse> {
    const phone = normalizeIranianPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException('Invalid Iranian phone number');
    }

    const code = String(randomInt(100000, 999999));
    const recentForPhone = await this.prisma.phoneOtp.count({
      where: {
        phone,
        createdAt: { gte: new Date(Date.now() - OTP_PHONE_WINDOW_MS) },
      },
    });
    if (recentForPhone >= OTP_MAX_PER_PHONE) {
      throw new ThrottlerException('Too many verification codes requested. Try again later.');
    }
    const codeHash = this.hashOtp(phone, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.phoneOtp.updateMany({
      where: { phone, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await this.prisma.phoneOtp.create({
      data: { phone, codeHash, expiresAt },
    });

    // Deliver via configured SMS provider (Kavenegar, …). Failures surface to the client.
    await this.smsService.sendOtp(phone, code);

    // Never expose OTP in production. In non-production, require an explicit flag.
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const expose =
      !isProduction && this.configService.get<string>('OTP_DEV_EXPOSE') === 'true';

    const masked =
      phone.length >= 4 ? `${phone.slice(0, 4)}****${phone.slice(-2)}` : '****';
    if (expose) {
      // Local DX only — never enable OTP_DEV_EXPOSE in production (Joi-enforced).
      console.info(`[otp] phone=${masked} code=${code}`);
    } else {
      console.info(`[otp] code dispatched to ${masked}`);
    }

    return {
      phone,
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
      ...(expose ? { devCode: code } : {}),
    };
  }

  async verifyOtp(
    rawPhone: string,
    code: string,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const phone = normalizeIranianPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException('Invalid Iranian phone number');
    }
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('Invalid verification code');
    }

    const otp = await this.prisma.phoneOtp.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('Code expired or not found');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many attempts. Request a new code.');
    }

    const ok = otp.codeHash === this.hashOtp(phone, code);
    if (!ok) {
      await this.prisma.phoneOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      const settings = await this.siteSettings.get();
      user = await this.prisma.user.create({
        data: {
          phone,
          phoneVerified: true,
          name: '',
          profileComplete: false,
          bootcampProfile: {
            create: {
              rank: settings.bootcamp.defaultRank,
              points: settings.bootcamp.defaultPoints,
            },
          },
        },
      });
    } else if (!user.phoneVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    return this.issueAuthResponse(await this.buildAuthUser(user));
  }

  async completeProfile(
    userId: string,
    dto: CompleteProfileDto,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const firstName = sanitizeProfileText(dto.firstName);
    const lastName = sanitizeProfileText(dto.lastName);
    const province = sanitizeProfileText(dto.province);
    const city = sanitizeProfileText(dto.city);
    const email = dto.email.trim().toLowerCase();

    if (!firstName || !lastName || !province || !city) {
      throw new BadRequestException('All profile fields are required');
    }
    if (!isValidIranProvince(province) || !isValidIranCity(province, city)) {
      throw new BadRequestException('Invalid province or city');
    }
    if (
      containsUnsafeText(firstName) ||
      containsUnsafeText(lastName) ||
      containsUnsafeText(province) ||
      containsUnsafeText(city)
    ) {
      throw new BadRequestException('Profile contains unsafe content');
    }
    if (!isValidEmail(email) || containsUnsafeText(email)) {
      throw new BadRequestException('Invalid email address');
    }

    const emailOwner = await this.prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== userId) {
      throw new ConflictException('Email already registered');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    const isFirstCompletion = existingUser && !existingUser.profileComplete;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        province,
        city,
        email,
        name: `${firstName} ${lastName}`.trim(),
        profileComplete: true,
      },
    });

    if (user.email && isFirstCompletion) {
      await this.emailService.sendWelcome({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }

    return this.issueAuthResponse(await this.buildAuthUser(user));
  }

  async getProfileDetails(userId: string): Promise<ProfileDetails> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      province: user.province ?? '',
      city: user.city ?? '',
      email: user.email,
      phone: user.phone,
      name: user.name,
      bio: user.bio ?? '',
      avatarUrl: user.avatarUrl ?? null,
    };
  }

  async updateProfile(
    userId: string,
    dto: CompleteProfileDto,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const result = await this.completeProfile(userId, dto);
    if (typeof dto.bio === 'string') {
      const bio = sanitizeProfileText(dto.bio).slice(0, 500);
      if (containsUnsafeText(bio)) {
        throw new BadRequestException('Profile contains unsafe content');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: { bio },
      });
    }
    return result;
  }

  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<ProfileDetails> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Avatar file is required');
    }
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException('Avatar must be a JPEG, PNG, WebP, or GIF image');
    }
    // Defense in depth: client-supplied MIME is untrusted — verify magic bytes.
    const detectedMime = sniffImageMime(file.buffer);
    if (!detectedMime || detectedMime !== file.mimetype) {
      throw new BadRequestException('Avatar content does not match its declared image type');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Avatar must be under 2MB');
    }

    const ext =
      file.mimetype === 'image/png'
        ? 'png'
        : file.mimetype === 'image/webp'
          ? 'webp'
          : file.mimetype === 'image/gif'
            ? 'gif'
            : 'jpg';

    const dir = join(process.cwd(), 'uploads', 'avatars');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const filename = `${userId}.${ext}`;
    writeFileSync(join(dir, filename), file.buffer);
    const avatarUrl = `/api/uploads/avatars/${filename}?t=${Date.now()}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return this.getProfileDetails(userId);
  }

  async refresh(
    user: AuthUser,
    refreshToken: string,
  ): Promise<AuthResponse & { refreshToken: string }> {
    // Atomic single-use claim: exactly ONE concurrent caller can delete the row.
    // A findFirst→delete pair would let two parallel refreshes both succeed,
    // defeating rotation-based theft detection.
    const claimed = await this.prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        token: this.hashRefreshToken(refreshToken),
        expiresAt: { gt: new Date() },
      },
    });
    if (claimed.count === 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueAuthResponse(user);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId, token: this.hashRefreshToken(refreshToken) },
      });
      return;
    }

    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async validateUser(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.buildAuthUser(user) : null;
  }

  async validateRefreshToken(
    userId: string,
    tokenId: string,
    refreshToken: string,
  ): Promise<AuthUser | null> {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { id: tokenId, userId, token: this.hashRefreshToken(refreshToken) },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return null;
    }

    return this.buildAuthUser(stored.user);
  }

  async getLearnerState(userId: string): Promise<LearnerState> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const [roadmaps, readinessTests, examAttempts, entitlements, enrollments] = await Promise.all([
      this.prisma.roadmap.findMany({
        where: { userId },
        select: { enrolled: true },
      }),
      this.prisma.readinessTest.findMany({
        where: { userId },
        select: { id: true },
      }),
      this.prisma.examAttempt.findMany({
        where: { userId, status: 'SUBMITTED' },
        select: { id: true },
      }),
      this.prisma.entitlement.findMany({ where: { userId } }),
      this.prisma.enrollment.findMany({
        where: { userId },
        include: { course: { select: { slug: true } } },
      }),
    ]);

    const hasRoadmap = roadmaps.length > 0;
    const roadmapEnrolled = roadmaps.some((roadmap) => roadmap.enrolled);
    // Readiness test is free — legacy readinessPaid kept for client compatibility.
    const readinessPaid = true;

    const authUser = await this.buildAuthUser(user);

    return {
      user: authUser,
      hasRoadmap,
      roadmapEnrolled,
      readinessPaid,
      testCompleted: readinessTests.length > 0 || examAttempts.length > 0,
      profileComplete: authUser.profileComplete,
      entitlements: entitlements.map(
        (entitlement) => `${entitlement.resourceType}:${entitlement.resourceId}`,
      ),
      enrollments: enrollments.map((enrollment) => enrollment.course.slug),
    };
  }

  private hashOtp(phone: string, code: string): string {
    return createHash('sha256').update(`${phone}:${code}`).digest('hex');
  }

  /** Refresh tokens are high-value credentials — persist only their digest. */
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueAuthResponse(
    user: AuthUser,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const tokens = await this.createTokens(user);
    return {
      user,
      ...tokens,
    };
  }

  private async createTokens(user: AuthUser): Promise<AuthTokens & { refreshToken: string }> {
    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    // Single write: derive the id first so the signed JWT can embed it and the
    // stored token IS the JWT (no pointless provisional value / second update).
    const tokenId = randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, tokenId },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: parseExpiresInSeconds(refreshExpiresIn),
      },
    );
    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        // Store only a SHA-256 digest of the JWT: a database leak must never
        // yield usable refresh tokens. Deploy note: tokens written by older
        // versions fail this lookup once and force a fresh OTP login.
        token: this.hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: addDurationToDate(refreshExpiresIn),
      },
    });

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email ?? user.phone ?? '',
        role: user.role,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: parseExpiresInSeconds(accessExpiresIn),
      },
    );

    return {
      accessToken,
      expiresIn: parseExpiresInSeconds(accessExpiresIn),
      refreshToken,
    };
  }

  private async buildAuthUser(user: {
    id: string;
    name: string;
    email: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    province?: string | null;
    city?: string | null;
    role: AuthUser['role'];
    profileComplete?: boolean;
    adminPanelAccess?: unknown;
  }): Promise<AuthUser> {
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      province: user.province ?? null,
      city: user.city ?? null,
      role: user.role,
      profileComplete: Boolean(user.profileComplete),
    };

    if (user.role === 'ADMIN') {
      const settings = await this.siteSettings.get();
      authUser.adminPanelAccess = resolveModeratorAdminAccess(
        user.adminPanelAccess,
        settings.adminAccess,
      );
    } else if (user.role !== 'LEARNER' && user.role !== 'SUPER_ADMIN') {
      // Custom (dynamic) roles carry their access matrix so the admin UI can
      // show/hide sections without an extra request.
      if (user.adminPanelAccess) {
        authUser.adminPanelAccess = normalizeAdminAccess(user.adminPanelAccess);
      } else {
        const role = await this.prisma.role.findUnique({ where: { key: user.role } });
        if (role?.access) {
          authUser.adminPanelAccess = normalizeAdminAccess(role.access);
        }
      }
    }

    return authUser;
  }
}
