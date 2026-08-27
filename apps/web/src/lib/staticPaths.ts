import { courseCatalog } from '@/lib/courseCatalog';

/** Course/lesson slugs used for static export (GitHub Pages). */
export const STATIC_COURSE_LESSONS = [
  ...courseCatalog.flatMap((course) =>
    course.lessons.map((lesson) => ({
      courseSlug: course.slug,
      lessonSlug: lesson.slug,
    })),
  ),
  { courseSlug: 'interview-branding', lessonSlug: 'portfolio-story' },
  { courseSlug: 'interview-branding', lessonSlug: 'interview-framework' },
] as const;

export const STATIC_COURSE_SLUGS = [
  ...courseCatalog.map((course) => course.slug),
  'interview-branding',
] as const;
