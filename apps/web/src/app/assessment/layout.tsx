import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('ارزیابی');

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
