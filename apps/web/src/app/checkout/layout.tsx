import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = privatePageMetadata('پرداخت');

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
