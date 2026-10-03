/**
 * Where the single back control lives.
 *
 * The shells (`SiteChrome` and the admin layout) render `PageBackButton` in one
 * fixed slot at the top of the page, above every page's own content. Only the
 * roots of the navigation trees are excluded — `/`, `/home` and `/admin` — since
 * a back control there would only point at itself.
 */

import { HOME_PATH } from '@/lib/postLoginPath';

/**
 * Fallback for learner/public pages opened without in-app history. `/` is the
 * one target that behaves correctly for both audiences: guests get the landing
 * page, and a signed-in learner is forwarded to `HOME_PATH` by the landing
 * page itself.
 */
export const PAGE_BACK_FALLBACK = '/';

/** Fallback for admin pages opened without in-app history. */
export const ADMIN_PAGE_BACK_FALLBACK = '/admin';

/** Routes that are roots of their own navigation tree. */
const NO_BACK_PATHS = new Set<string>(['/', HOME_PATH]);

/** Whether the shell should render the back control for this route. */
export function showsPageBack(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return !NO_BACK_PATHS.has(pathname);
}

/** The admin panel home is the root of the admin tree, so it carries no back pill. */
export function showsAdminPageBack(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname !== '/admin' && pathname !== '/admin/';
}
