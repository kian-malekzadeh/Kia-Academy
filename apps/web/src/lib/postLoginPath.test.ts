import { describe, expect, it } from 'vitest';
import { resolvePostLoginPath } from './postLoginPath';

describe('resolvePostLoginPath', () => {
  it('sends staff to admin by default', () => {
    expect(resolvePostLoginPath('SUPER_ADMIN', null)).toBe('/admin');
    expect(resolvePostLoginPath('ADMIN', '/dashboard')).toBe('/admin');
  });

  it('honors admin next paths for staff', () => {
    expect(resolvePostLoginPath('ADMIN', '/admin/users')).toBe('/admin/users');
  });

  it('never sends learners to /admin (breaks redirect loops)', () => {
    expect(resolvePostLoginPath('LEARNER', '/admin')).toBe('/dashboard');
    expect(resolvePostLoginPath('LEARNER', '/admin/users')).toBe('/dashboard');
  });

  it('maps learner home next to dashboard', () => {
    expect(resolvePostLoginPath('LEARNER', '/')).toBe('/dashboard');
    expect(resolvePostLoginPath('LEARNER', '/roadmap')).toBe('/roadmap');
  });

  it('rejects open redirects', () => {
    expect(resolvePostLoginPath('LEARNER', '//evil.example')).toBe('/dashboard');
    expect(resolvePostLoginPath('LEARNER', 'https://evil.example')).toBe('/dashboard');
  });
});
