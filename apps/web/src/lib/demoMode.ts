/**
 * Demo mode powers the static GitHub Pages build without a Nest API.
 * Local/Docker leave NEXT_PUBLIC_DEMO_MODE unset and use the /api proxy.
 * If NEXT_PUBLIC_API_URL is set, live API always wins.
 */
export function isDemoMode(): boolean {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
  if (apiUrl) return false;
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}
