import { AuthController } from './auth.controller';

describe('AuthController refresh cookie', () => {
  it('sets refreshToken cookie with path=/ for client refresh flows', async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        user: { id: 'u1', name: 'Alex', email: 'a@b.c', role: 'LEARNER' },
        accessToken: 'access',
        expiresIn: 900,
        refreshToken: 'refresh-token',
      }),
    };
    const configService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        if (key === 'NODE_ENV') return 'development';
        return fallback;
      }),
    };

    const controller = new AuthController(authService as never, configService as never);

    const cookie = jest.fn();
    const res = { cookie } as never;

    await controller.login({ email: 'a@b.c', password: 'secret' }, res);

    expect(cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      }),
    );
  });
});
