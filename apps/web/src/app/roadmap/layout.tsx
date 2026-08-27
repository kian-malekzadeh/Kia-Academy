import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('نقشه راه');

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
