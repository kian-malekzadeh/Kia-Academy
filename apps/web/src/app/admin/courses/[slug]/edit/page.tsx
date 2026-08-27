import { courseCatalog } from '@/lib/courseCatalog';
import EditCourseForm from './EditCourseForm';

export function generateStaticParams() {
  return courseCatalog.map((course) => ({ slug: course.slug }));
}

export const dynamicParams = false;

export default function Page() {
  return <EditCourseForm />;
}