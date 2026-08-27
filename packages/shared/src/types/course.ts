export interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  durationMin: number;
  completed: boolean;
  hasVideo?: boolean;
}

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  trackKey: string | null;
  lessonCount: number;
  enrolled: boolean;
  progressPct: number;
  /** Slug of the first lesson (sortOrder asc) — set on /courses/mine for direct "continue" links. */
  firstLessonSlug?: string | null;
}

export interface LessonDetail extends LessonSummary {
  content: string;
  videoUrl: string | null;
  courseSlug: string;
  courseTitle: string;
  prevSlug: string | null;
  nextSlug: string | null;
}
