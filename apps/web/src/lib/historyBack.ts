/**
 * History-aware back navigation.
 *
 * Every «بازگشت» control must land on the page the user actually came from, so
 * each page records the path it was opened from. `document.referrer` cannot be
 * used for that: it belongs to the document load, not to client-side
 * navigations, so it goes stale as soon as the user moves around the SPA.
 * Instead a small per-tab path stack lives in `sessionStorage` and is kept in
 * sync by `HistoryTracker` on every pathname change.
 *
 * When there is no in-app history at all (typed URL, bookmark, link from
 * another site, link opened in a new tab) callers fall back to their own
 * `href`, so those pages are still reachable.
 */

/** Per-tab stack of visited paths; trimmed so long sessions cannot grow it forever. */
const STACK_KEY = 'kia-history-stack';
const MAX_DEPTH = 50;

function readStack(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STACK_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function writeStack(stack: string[]): void {
  try {
    window.sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-MAX_DEPTH)));
  } catch {
    // Private-mode / quota errors only cost us the in-app back target.
  }
}

/**
 * Records the current page. Called for every pathname change; re-visiting an
 * already known path (browser back/forward) rewinds the stack instead of
 * growing it, which keeps it aligned with the real history.
 */
export function trackHistoryEntry(pathname: string): void {
  if (typeof window === 'undefined' || !pathname) return;
  const stack = readStack();
  if (stack[stack.length - 1] === pathname) return;
  const seenAt = stack.lastIndexOf(pathname);
  writeStack(seenAt >= 0 ? stack.slice(0, seenAt + 1) : [...stack, pathname]);
}

/** Path the user came from, or `undefined` when this page has no in-app parent. */
export function previousPathname(): string | undefined {
  const stack = readStack();
  return stack.length > 1 ? stack[stack.length - 2] : undefined;
}

/** True when going back stays inside the site and lands on a real previous page. */
export function canGoBackInApp(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.history.length <= 1) return false;
  return previousPathname() !== undefined;
}