import { authenticate } from './auth';

describe('mobile auth API', () => {
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = originalUrl;
    jest.restoreAllMocks();
  });

  test.each(['login', 'register'] as const)(
    '%s sends mobile credentials and returns a typed session',
    async (operation) => {
      const session = {
        user: {
          id: '8d15334b-61d2-4aca-99b8-d633523d098b',
          email: 'person@example.com',
          displayName: null,
          avatarUrl: null,
        },
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
      };
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => session,
      } as Response);

      await expect(
        authenticate(operation, {
          email: 'Person@Example.com',
          password: 'long-example-password',
        }),
      ).resolves.toEqual(session);
      expect(fetchMock).toHaveBeenCalledWith(
        `http://192.168.1.8:3001/api/v1/auth/${operation}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'person@example.com',
            password: 'long-example-password',
            client: 'mobile',
          }),
        },
      );
    },
  );

  test('returns a stable API error without exposing submitted credentials', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' },
      }),
    } as Response);

    await expect(
      authenticate('login', { email: 'person@example.com', password: 'secret-password' }),
    ).rejects.toMatchObject({
      name: 'AuthApiError',
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
  });

  test('rejects malformed successful responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 'one' } }),
    } as Response);

    await expect(
      authenticate('register', { email: 'person@example.com', password: 'long-example-password' }),
    ).rejects.toThrow('Invalid authentication response.');
  });

  test('uses a safe error when the server error body is malformed', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ unexpected: true }),
    } as Response);

    await expect(
      authenticate('login', { email: 'person@example.com', password: 'long-example-password' }),
    ).rejects.toEqual(expect.objectContaining({
      code: 'REQUEST_FAILED',
      status: 500,
    }));
  });

  test('keeps valid field messages and ignores malformed field values', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Check your input.',
          fields: { email: ['Enter a valid email.'], password: 42 },
        },
      }),
    } as Response);

    await expect(
      authenticate('register', { email: 'bad', password: 'long-example-password' }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      fields: { email: ['Enter a valid email.'] },
    });
  });
});
