import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('پنل یادگیری');

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
