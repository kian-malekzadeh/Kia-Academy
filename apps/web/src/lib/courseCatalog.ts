import { buildCourseCatalog, type CourseDbFile } from '@kia-academy/shared';
import courseDb from '../../../../db.json';

/** Courses + lessons derived from monorepo-root `db.json`. */
export const courseCatalog = buildCourseCatalog(courseDb as CourseDbFile);

export const primaryCourseSlug = courseCatalog[0]?.slug ?? 'html';
export const primaryLessonSlug = courseCatalog[0]?.lessons[0]?.slug ?? 'html-home';
