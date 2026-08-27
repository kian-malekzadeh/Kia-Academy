import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('آزمون آمادگی');

export default function ReadinessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
