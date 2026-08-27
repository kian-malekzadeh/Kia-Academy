import { demoCourseExamStaticParams } from '@/lib/demoApi';
import CourseExamRunner from './ExamRunner';

/** Pre-render demo exam routes for the GitHub Pages export build. */
export function generateStaticParams() {
  return demoCourseExamStaticParams();
}

export default function Page() {
  return <CourseExamRunner />;
}