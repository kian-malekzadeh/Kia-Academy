import { primaryCourseSlug } from '@/lib/courseCatalog';
import TicketDetail from './TicketDetail';

// No seeded/demo ticket exists; export a single demo route so `output: export`
// produces a valid page. Content loads client-side (demo mode shows an empty state).
export function generateStaticParams() {
  return [{ id: primaryCourseSlug }];
}

export const dynamicParams = false;

export default function Page() {
  return <TicketDetail />;
}