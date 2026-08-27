import { courseCatalog } from '@/lib/courseCatalog';
import CourseDetail from './CourseDetail';

export function generateStaticParams() {
  return courseCatalog.map((course) => ({ slug: course.slug }));
}

export const dynamicParams = false;

export default function Page() {
  return <CourseDetail />;
}