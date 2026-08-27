import type { MetadataRoute } from 'next';
import { courseCatalog } from '@/lib/courseCatalog';
import { absoluteUrl, PUBLIC_SITEMAP_PATHS } from '@/lib/seo';

export const dynamic = 'force-static';

/**
 * Sitemap generated from real public routes + course catalog (db.json / shared catalog).
 * Private app routes are intentionally omitted.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/courses' || path === '/material' ? 0.8 : 0.6,
  }));

  const courseEntries: MetadataRoute.Sitemap = courseCatalog.map((course) => ({
    url: absoluteUrl(`/courses/${course.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticEntries, ...courseEntries];
}
