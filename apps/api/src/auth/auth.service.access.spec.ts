import { AuthService } from './auth.service';

/**
 * ADM-1 regression: the server must ISSUE the effective admin-panel matrix on
 * AuthUser (user override → custom role matrix → site template) so the admin
 * UI never re-derives permissions client-side.
 */
describe('AuthService.buildAuthUser — server-issued admin access', () => {
  const baseUser = {
    id: 'u-1',
    name: 'Staff',
    email: 'staff@example.com',
    role: 'ADMIN' as const,
    profileComplete: true,
  };

  function buildService(options: { role?: { key: string; access: unknown } | null } = {}) {
    const prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      role: { findUnique: jest.fn().mockResolvedValue(options.role ?? null) },
      phoneOtp: { count: jest.fn(), findFirst: jest.fn() },
      refreshToken: { deleteMany: jest.fn(), findFirst: jest.fn() },
    };
    return new AuthService(
      prisma as never,
      { sign: jest.fn(), verify: jest.fn() } as never,
      { get: jest.fn().mockReturnValue(undefined) } as never,
      {} as never,
      { get: jest.fn().mockResolvedValue({}) } as never,
      { sendOtp: jest.fn() } as never,
      { loginGate: jest.fn().mockResolvedValue(null) } as never,
    );
  }

  it('issues a resolved matrix for ADMIN users (template fallback)', async () => {
    const service = buildService();
    const user = await (service as unknown as {
      buildAuthUser: (u: typeof baseUser) => Promise<{ adminPanelAccess?: unknown }>;
    }).buildAuthUser(baseUser);
    // The site settings service returns {} here; the resolver normalizes it.
    expect(user.adminPanelAccess).toBeDefined();
    expect(typeof user.adminPanelAccess).toBe('object');
  });

  it('issues the custom role matrix for dynamic roles without a user override', async () => {
    const roleMatrix = { users: { view: true, manage: true, edit: false } };
    const service = buildService({ role: { key: 'support-agent', access: roleMatrix } });
    const user = await (service as unknown as {
      buildAuthUser: (u: unknown) => Promise<{ adminPanelAccess?: { users?: unknown } }>;
    }).buildAuthUser({ ...baseUser, role: 'support-agent', adminPanelAccess: null });
    expect(user.adminPanelAccess?.users).toEqual({ view: true, manage: true, edit: false });
  });

  it('issues the site template for dynamic roles with no matrix anywhere', async () => {
    const service = buildService({ role: null });
    const user = await (service as unknown as {
      buildAuthUser: (u: unknown) => Promise<{ adminPanelAccess?: unknown }>;
    }).buildAuthUser({ ...baseUser, role: 'support-agent', adminPanelAccess: null });
    expect(user.adminPanelAccess).toBeDefined();
  });

  it('never issues a matrix to learners or super admins', async () => {
    const service = buildService();
    const build = (service as unknown as {
      buildAuthUser: (u: unknown) => Promise<{ adminPanelAccess?: unknown }>;
    }).buildAuthUser;
    const learner = await build({ ...baseUser, role: 'LEARNER' });
    const superAdmin = await build({ ...baseUser, role: 'SUPER_ADMIN' });
    expect(learner.adminPanelAccess).toBeUndefined();
    expect(superAdmin.adminPanelAccess).toBeUndefined();
  });
});
