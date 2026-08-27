import { courseCatalog } from '@/lib/courseCatalog';
import LessonPlayer from './LessonPlayer';

export function generateStaticParams() {
  const params: Array<{ courseSlug: string; lessonSlug: string }> = [];
  for (const course of courseCatalog) {
    for (const lesson of course.lessons) {
      params.push({ courseSlug: course.slug, lessonSlug: lesson.slug });
    }
  }
  return params;
}

export const dynamicParams = false;

export default function Page() {
  return <LessonPlayer />;
}