import type { Metadata } from 'next';
import Link from 'next/link';
import { noIndexRobots } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'صفحه پیدا نشد',
  description: 'این مسیر در کیا آکادمی وجود ندارد.',
  robots: noIndexRobots,
};

export default function NotFound() {
  return (
    <div className="page-content">
      <div className="container">
        <h1>صفحه پیدا نشد</h1>
        <p className="auth-sub">این مسیر بخشی از کیا آکادمی نیست.</p>
        <Link href="/" className="cta-primary">
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}
