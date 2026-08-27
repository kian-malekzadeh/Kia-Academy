export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH';

export type TicketCategory = 'technical' | 'admin' | 'education' | 'finance';

export interface CreateTicketDto {
  subject: string;
  body: string;
  courseId?: string;
  courseSlug?: string;
  priority?: TicketPriority;
  category?: TicketCategory | string;
}

export interface TicketReplyDto {
  body: string;
}

export interface TicketAttachmentDto {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

export interface SupportTicketSummary {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  courseId: string | null;
  courseSlug: string | null;
  courseTitle: string | null;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
}

export interface SupportTicketDetail extends SupportTicketSummary {
  body: string;
  attachments: TicketAttachmentDto[];
  replies: Array<{
    id: string;
    body: string;
    isStaff: boolean;
    authorName: string;
    createdAt: string;
    attachments: TicketAttachmentDto[];
  }>;
}

export interface LearnerMessageDto {
  id: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface CreateLearnerMessageDto {
  userId: string;
  subject: string;
  body: string;
}

export interface LearnerTodoDto {
  id: string;
  title: string;
  done: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDto {
  title: string;
}

export interface UpdateTodoDto {
  title?: string;
  done?: boolean;
  sortOrder?: number;
}

export interface CompetitionSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  registered: boolean;
}

export interface CourseAttachmentDto {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface LearnerProgressPoint {
  label: string;
  value: number;
  kind: 'course' | 'exam' | 'bootcamp';
}

export interface LearnerProgressActivity {
  id: string;
  text: string;
  createdAt: string;
}

export interface LearnerProgressSummary {
  courses: Array<{
    slug: string;
    title: string;
    progressPct: number;
  }>;
  examAverage: number | null;
  bootcampPoints: number;
  points: LearnerProgressPoint[];
  /** Weighted overall progress 0–100 for the dashboard doughnut. */
  overallPct: number;
  courseCount: number;
  examCount: number;
  certificateCount: number;
  activity: LearnerProgressActivity[];
}

export interface ProfileDetails {
  firstName: string;
  lastName: string;
  province: string;
  city: string;
  email: string | null;
  phone: string | null;
  name: string;
  bio: string;
  avatarUrl: string | null;
}
