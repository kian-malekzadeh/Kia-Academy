import { redirect } from 'next/navigation';

/**
 * Public registration is phone-only: the OTP flow at `/education` is the
 * single sign-up entry point. This route stays as a redirect so old bookmarks
 * and external links land on the phone flow instead of a 404 — the
 * email/password endpoint (`POST /auth/register`) no longer exists.
 */
export default function RegisterPage() {
  redirect('/education');
}