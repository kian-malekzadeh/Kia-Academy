import type { UserRole } from './auth';
import type { SiteAdminAccessSettings } from './site-settings';

export interface AdminStats {
  users: number;
  courses: number;
  lessons: number;
  enrollments: number;
  payments: number;
  revenueCents: number;
  challenges: number;
  activeChallenges: number;
}

export interface AdminLesson {
  id: string;
  slug: string;
  title: string;
  content: string;
  videoUrl: string | null;
  durationMin: number;
  sortOrder: number;
}

export interface AdminCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  trackKey: string | null;
  sortOrder: number;
  published: boolean;
  lessonCount?: number;
  lessons?: AdminLesson[];
}

export interface AdminChallenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  points: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  starterCode: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  role: UserRole;
  createdAt: string;
  adminPanelAccess?: SiteAdminAccessSettings | null;
}

export interface AdminCreateUserDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface AdminPayment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  productType: string;
  productRef: string | null;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface CreateCourseDto {
  slug: string;
  title: string;
  description: string;
  icon?: string;
  trackKey?: string;
  sortOrder?: number;
  published?: boolean;
  lessons?: CreateLessonDto[];
}

export type UpdateCourseDto = Partial<CreateCourseDto>;

export interface CreateLessonDto {
  slug: string;
  title: string;
  content: string;
  durationMin?: number;
  sortOrder?: number;
}

export interface CreateChallengeDto {
  slug: string;
  title: string;
  description: string;
  points?: number;
  startsAt: string;
  endsAt: string;
  active?: boolean;
  starterCode?: string;
}

export type UpdateChallengeDto = Partial<CreateChallengeDto>;

export type UpdateLessonDto = Partial<CreateLessonDto>;

export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}
