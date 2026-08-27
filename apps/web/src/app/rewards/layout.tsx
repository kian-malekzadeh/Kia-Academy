import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('جوایز');

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
