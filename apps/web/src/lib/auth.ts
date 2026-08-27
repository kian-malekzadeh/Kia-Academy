const ACCESS_TOKEN_KEY = 'kia_academy_access_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    /* ignore quota errors */
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
