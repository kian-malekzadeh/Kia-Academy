import AdminTicketDetail from './TicketDetail';

// Static export (GitHub Pages) requires concrete params for dynamic routes.
// A single seeded demo ticket id keeps demo mode navigable; in live mode the
// route is served by the Next.js server, so this only affects the export.
export function generateStaticParams() {
  return [{ id: 'demo-ticket-1' }];
}

export const dynamicParams = false;

export default function Page() {
  return <AdminTicketDetail />;
}
