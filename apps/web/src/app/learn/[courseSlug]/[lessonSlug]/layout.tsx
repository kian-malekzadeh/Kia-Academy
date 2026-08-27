import type { Metadata } from 'next';
import { STATIC_COURSE_LESSONS } from '@/lib/staticPaths';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('درس');

export function generateStaticParams() {
  return STATIC_COURSE_LESSONS.map(({ courseSlug, lessonSlug }) => ({
    courseSlug,
    lessonSlug,
  }));
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
