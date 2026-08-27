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

export type CatalogCourseSeed = {
  sourceId: number;
  slug: string;
  title: string;
  description: string;
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
  videoUrl: string | null;
  durationMin: number;
  sortOrder: number;
  playground: CourseDbPlayground | null;
};
