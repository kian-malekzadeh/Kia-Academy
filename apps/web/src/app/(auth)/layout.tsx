import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('ورود');

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
