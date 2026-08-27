/**
 * Resolve where to send a user after a successful login submit.
 * - Staff always prefer the admin panel (honor /admin* next paths).
 * - Learners must not enter /admin (admin shell will send them back to login).
 */
export function resolvePostLoginPath(
  role: string | undefined,
  next: string | null | undefined,
): string {
  const raw = (next ?? '').trim();
  const target =
    raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/login') ? raw : '/dashboard';

  const isStaff = role === 'SUPER_ADMIN' || role === 'ADMIN';
  if (isStaff) {
    return target.startsWith('/admin') ? target : '/admin';
  }

  // After a learner signs in with next=/admin, send them to the learner home.
  // (The login page itself clears learner sessions when opening the admin gate.)
  if (target === '/' || target.startsWith('/admin')) {
    return '/dashboard';
  }
  return target;
}
