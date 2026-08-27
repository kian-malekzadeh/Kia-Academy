/** Resolve a media path returned by the API for use in <video src>. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('blob:')) return path;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsed = new URL(path);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return path;
    } catch {
      return null;
    }
  }

  if (path.startsWith('/')) {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
    return `${base}${path}`;
  }

  // Reject unknown schemes (ex: data:, javascript:) and malformed URLs.
  return null;
}
