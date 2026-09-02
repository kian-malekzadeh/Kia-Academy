export type CourseDbPlayground = {
  language?: string;
  html?: string;
  css?: string;
  js?: string;
  javascript?: string;
};

export type CourseDbCourse = {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  order_index: number;
  created_at?: string;
  updated_at?: string;
};

export type CourseDbLesson = {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  order_index: number;
  playground_config?: string | null;
  playground?: CourseDbPlayground | null;
  created_at?: string;
  updated_at?: string;
};

export type CourseDbFile = {
  meta?: unknown;
  schema?: unknown;
  courses: CourseDbCourse[];
  lessons: CourseDbLesson[];
  users?: unknown[];
  user_lesson_progress?: unknown[];
  user_notes?: unknown[];
};

/** English overlay for a single lesson (keyed by the db.json lesson id). */
export type CourseDbEnLesson = {
  description: string;
  /** Optional English playground starter (only needed when the fa one contains Persian text). */
  playground?: CourseDbPlayground | null;
};

/**
 * English overlay used to build localized (en) seed content on top of the
 * Persian-first `db.json`. Keyed by the numeric source ids of db.json.
 */
export type CourseDbEnOverlay = {
  courses: Record<number, string>;
  lessons: Record<number, CourseDbEnLesson>;
};

export type CatalogCourseSeed = {
  sourceId: number;
  slug: string;
  title: string;
  description: string;
  /** English description (null → fall back to `description`). */
  descriptionEn: string | null;
  icon: string;
  trackKey: string;
  sortOrder: number;
  lessons: CatalogLessonSeed[];
};

export type CatalogLessonSeed = {
  sourceId: number;
  slug: string;
  title: string;
  content: string;
  /** Packed English markdown + playground (null → fall back to `content`). */
  contentEn: string | null;
  videoUrl: string | null;
  durationMin: number;
  sortOrder: number;
  playground: CourseDbPlayground | null;
};
