import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('بوت‌کمپ');

export default function BootcampLayout({ children }: { children: React.ReactNode }) {
  return children;
}
