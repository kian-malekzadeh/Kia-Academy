import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';
import AdminLayoutClient from './AdminLayoutClient';

export const metadata: Metadata = privatePageMetadata('پنل مدیریت');

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
