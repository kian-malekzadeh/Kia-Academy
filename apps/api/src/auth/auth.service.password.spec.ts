import { BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';

/**
 * Unit tests for the AUTH-4 password reset / change-password flows:
 *  - account enumeration protection on forgot-password
 *  - email-bomb cap (silent, no attacker signal)
 *  - single-use, expiring, hashed-at-rest reset tokens
 *  - session revocation on reset
 *  - current-password verification + other-device revocation on change
 */

function buildService(overrides?: {
  storedUser?: Record<string, unknown> | null;
  resetTokenCount?: number;
  storedResetToken?: Record<string, unknown> | null;
  claimCount?: number;
  emailStatus?: 'sent' | 'skipped' | 'failed';
  nodeEnv?: string;
}) {
  const tx = {
    passwordResetToken: {
      updateMany: jest.fn().mockResolvedValue({ count: overrides?.claimCount ?? 1 }),
    },
    user: {
      update: jest.fn().mockResolvedValue({}),
    },
    refreshToken: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const prisma = {
    phoneOtp: {
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'otp1' }),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(overrides?.storedUser ?? null),
      update: jest.fn().mockResolvedValue({}),
    },
    refreshToken: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    passwordResetToken: {
      count: jest.fn().mockResolvedValue(overrides?.resetTokenCount ?? 0),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'prt1' }),
      findUnique: jest.fn().mockResolvedValue(overrides?.storedResetToken ?? null),
      updateMany: tx.passwordResetToken.updateMany,
    },
    $transaction: jest.fn(async (arg: unknown) => (typeof arg === 'function' ? arg(tx) : arg)),
  };
  const emailService = {
    sendPasswordReset: jest.fn().mockResolvedValue(overrides?.emailStatus ?? 'sent'),
  };
  const configGet = jest.fn((key: string, fallback?: unknown) => {
    if (key === 'NODE_ENV') return overrides?.nodeEnv ?? 'test';
    if (key === 'APP_URL') return 'http://localhost:3000';
    return fallback;
  });
  const service = new AuthService(
    prisma as never,
    { sign: jest.fn(), verify: jest.fn() } as never,
    { get: configGet } as never,
    emailService as never,
    { get: jest.fn().mockResolvedValue({}) } as never,
    { sendOtp: jest.fn().mockResolvedValue(undefined) } as never,
    { loginGate: jest.fn().mockResolvedValue(null) } as never,
  );
  return { service, prisma, tx, emailService, configGet };
}

const USER = {
  id: 'u1',
  email: 'a@b.com',
  name: 'A',
  status: 'ACTIVE',
};

const RAW_TOKEN = 'a'.repeat(64);
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

describe('forgotPassword (AUTH-4)', () => {
  it('silently ignores unknown emails (no enumeration signal)', async () => {
    const { service, prisma, emailService } = buildService({ storedUser: null });
    await expect(service.forgotPassword({ email: 'ghost@example.com' })).resolves.toBeUndefined();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('rejects malformed emails before touching the database', async () => {
    const { service, prisma } = buildService({});
    await expect(service.forgotPassword({ email: 'not-an-email' })).resolves.toBeUndefined();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('invalidates older tokens, stores only a digest, and emails the link', async () => {
    const { service, prisma, emailService } = buildService({ storedUser: USER });
    await service.forgotPassword({ email: 'A@B.com' }); // mixed case → normalized lookup

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
    });

    const created = prisma.passwordResetToken.create.mock.calls[0][0].data;
    expect(created.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(created.userId).toBe('u1');
    expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now());

    expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      expect.stringContaining('/reset-password?token='),
      30,
    );
    const link: string = emailService.sendPasswordReset.mock.calls[0][1];
    const rawToken = new URL(link).searchParams.get('token') as string;
    expect(created.tokenHash).not.toBe(rawToken);
    expect(created.tokenHash).toBe(sha256(rawToken));
  });

  it('stops emailing after the per-account cap, still without an error signal', async () => {
    const { service, prisma, emailService } = buildService({
      storedUser: USER,
      resetTokenCount: 3,
    });
    await expect(service.forgotPassword({ email: 'a@b.com' })).resolves.toBeUndefined();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('never logs the reset link in production even when SMTP is unavailable', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    try {
      const { service } = buildService({
        storedUser: USER,
        emailStatus: 'skipped',
        nodeEnv: 'production',
      });
      await expect(service.forgotPassword({ email: 'a@b.com' })).resolves.toBeUndefined();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('logs the link only outside production when email delivery is unavailable', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    try {
      const { service } = buildService({
        storedUser: USER,
        emailStatus: 'skipped',
        nodeEnv: 'development',
      });
      await service.forgotPassword({ email: 'a@b.com' });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[dev-only]'));
    } finally {
      warnSpy.mockRestore();
    }
  });
});

describe('resetPassword (AUTH-4)', () => {
  it('rejects mismatched password confirmation', async () => {
    const { service, prisma } = buildService({});
    await expect(
      service.resetPassword({ token: RAW_TOKEN, password: 'newpass1', passwordConfirm: 'other1' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it('rejects malformed tokens before any database lookup', async () => {
    const { service, prisma } = buildService({});
    await expect(
      service.resetPassword({ token: 'short-token', password: 'newpass1', passwordConfirm: 'newpass1' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it('rejects expired tokens', async () => {
    const { service, prisma } = buildService({
      storedResetToken: {
        id: 'prt1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: { status: 'ACTIVE' },
      },
    });
    await expect(
      service.resetPassword({ token: RAW_TOKEN, password: 'newpass1', passwordConfirm: 'newpass1' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects already-used tokens', async () => {
    const { service } = buildService({
      storedResetToken: {
        id: 'prt1',
        userId: 'u1',
        usedAt: new Date(Date.now() - 1000),
        expiresAt: new Date(Date.now() + 60_000),
        user: { status: 'ACTIVE' },
      },
    });
    await expect(
      service.resetPassword({ token: RAW_TOKEN, password: 'newpass1', passwordConfirm: 'newpass1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses suspended accounts even with a valid token', async () => {
    const { service } = buildService({
      storedResetToken: {
        id: 'prt1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { status: 'BANNED' },
      },
    });
    await expect(
      service.resetPassword({ token: RAW_TOKEN, password: 'newpass1', passwordConfirm: 'newpass1' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('claims the token atomically, updates the hash, and revokes every session', async () => {
    const { service, prisma, tx } = buildService({
      storedResetToken: {
        id: 'prt1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { status: 'ACTIVE' },
      },
    });
    await service.resetPassword({ token: RAW_TOKEN, password: 'newpass1', passwordConfirm: 'newpass1' });

    expect(tx.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { id: 'prt1', usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    const update = tx.user.update.mock.calls[0][0];
    expect(update.where).toEqual({ id: 'u1' });
    // The stored hash must verify against the NEW password.
    await expect(bcrypt.compare('newpass1', update.data.passwordHash)).resolves.toBe(true);
    // Credential was compromised-enough to rotate: all refresh tokens die.
    expect(tx.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    // No direct (non-transactional) writes escaped the transaction.
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('loses the race on a replayed token and changes nothing', async () => {
    const { service, tx } = buildService({
      storedResetToken: {
        id: 'prt1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { status: 'ACTIVE' },
      },
      claimCount: 0,
    });
    await expect(
      service.resetPassword({ token: RAW_TOKEN, password: 'newpass1', passwordConfirm: 'newpass1' }),
    ).rejects.toThrow(BadRequestException);
    expect(tx.user.update).not.toHaveBeenCalled();
  });
});

describe('changePassword (AUTH-4)', () => {
  let knownHash: string;
  beforeAll(async () => {
    knownHash = await bcrypt.hash('oldpass1', 12);
  });

  it('rejects a wrong current password', async () => {
    const { service, prisma } = buildService({
      storedUser: { ...USER, passwordHash: knownHash },
    });
    await expect(
      service.changePassword('u1', { currentPassword: 'wrongpass1', newPassword: 'newpass1' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('explains that OTP-only accounts must set a password first', async () => {
    const { service } = buildService({ storedUser: { ...USER, passwordHash: null } });
    await expect(
      service.changePassword('u1', { currentPassword: 'oldpass1', newPassword: 'newpass1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses a new password identical to the current one', async () => {
    const { service } = buildService({
      storedUser: { ...USER, passwordHash: knownHash },
    });
    await expect(
      service.changePassword('u1', { currentPassword: 'oldpass1', newPassword: 'oldpass1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates the hash and revokes only OTHER devices when a cookie is present', async () => {
    const { service, prisma } = buildService({
      storedUser: { ...USER, passwordHash: knownHash },
    });
    await service.changePassword(
      'u1',
      { currentPassword: 'oldpass1', newPassword: 'newpass1' },
      'current-refresh-jwt',
    );

    const update = prisma.user.update.mock.calls[0][0];
    await expect(bcrypt.compare('newpass1', update.data.passwordHash)).resolves.toBe(true);
    await expect(bcrypt.compare('oldpass1', update.data.passwordHash)).resolves.toBe(false);

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', token: { not: sha256('current-refresh-jwt') } },
    });
  });

  it('revokes every session when no current cookie is available', async () => {
    const { service, prisma } = buildService({
      storedUser: { ...USER, passwordHash: knownHash },
    });
    await service.changePassword('u1', { currentPassword: 'oldpass1', newPassword: 'newpass1' });

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });
});
