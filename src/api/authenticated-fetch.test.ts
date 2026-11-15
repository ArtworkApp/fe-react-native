import { createAuthenticatedFetch } from './authenticated-fetch';

const originalUrl = process.env.EXPO_PUBLIC_API_URL;
const oldTokens = { accessToken: 'old.access', refreshToken: 'old.refresh' };
const newTokens = { accessToken: 'new.access', refreshToken: 'new.refresh' };

beforeEach(() => { process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1'; });
afterEach(() => { process.env.EXPO_PUBLIC_API_URL = originalUrl; jest.restoreAllMocks(); });

test('attaches the access token to an authenticated request', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ status: 200 } as Response);
  const client = createAuthenticatedFetch({
    getTokens: () => oldTokens, refresh: jest.fn(), invalidate: jest.fn(),
  });
  await client('private', { method: 'GET' });
  expect(fetchMock).toHaveBeenCalledWith('http://192.168.1.8:3001/api/v1/private', expect.objectContaining({
    method: 'GET', headers: expect.any(Headers),
  }));
  expect((fetchMock.mock.calls[0][1]?.headers as Headers).get('Authorization')).toBe('Bearer old.access');
});

test('shares one refresh across simultaneous unauthorized responses', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async (_url, options) => {
    const authorization = (options?.headers as Headers).get('Authorization');
    return { status: authorization === 'Bearer old.access' ? 401 : 200 } as Response;
  });
  let current = oldTokens;
  const refresh = jest.fn(async () => { current = newTokens; return newTokens; });
  const client = createAuthenticatedFetch({ getTokens: () => current, refresh, invalidate: jest.fn() });
  const responses = await Promise.all([client('private/a'), client('private/b')]);
  expect(responses.map((response) => response.status)).toEqual([200, 200]);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

test('retries once and invalidates the session after a second 401', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ status: 401 } as Response);
  const invalidate = jest.fn();
  let current = oldTokens;
  const refresh = jest.fn(async () => { current = newTokens; return newTokens; });
  const client = createAuthenticatedFetch({ getTokens: () => current, refresh, invalidate });
  expect((await client('private')).status).toBe(401);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(invalidate).toHaveBeenCalledTimes(1);
});

test('uses already rotated tokens when a delayed 401 arrives', async () => {
  let current = oldTokens;
  let resolveDelayed: (response: Response) => void = () => {};
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
    const authorization = (options?.headers as Headers).get('Authorization');
    if (authorization === 'Bearer new.access') return { status: 200 } as Response;
    if (String(url).endsWith('/slow')) return new Promise((resolve) => { resolveDelayed = resolve; });
    return { status: 401 } as Response;
  });
  const refresh = jest.fn(async () => { current = newTokens; return newTokens; });
  const client = createAuthenticatedFetch({ getTokens: () => current, refresh, invalidate: jest.fn() });
  const slow = client('private/slow');
  expect((await client('private/fast')).status).toBe(200);
  resolveDelayed({ status: 401 } as Response);
  expect((await slow).status).toBe(200);
  expect(refresh).toHaveBeenCalledTimes(1);
});

test('does not retry after the user signs out during refresh', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ status: 401 } as Response);
  let current: typeof oldTokens | null = oldTokens;
  let finishRefresh: (value: typeof newTokens) => void = () => {};
  const refresh = jest.fn(() => new Promise<typeof newTokens>((resolve) => { finishRefresh = resolve; }));
  const client = createAuthenticatedFetch({ getTokens: () => current, refresh, invalidate: jest.fn() });
  const request = client('private');
  await Promise.resolve();
  await Promise.resolve();
  current = null;
  finishRefresh(newTokens);
  expect((await request).status).toBe(401);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('does not send tokens to external URLs or authentication endpoints', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  const client = createAuthenticatedFetch({
    getTokens: () => oldTokens, refresh: jest.fn(), invalidate: jest.fn(),
  });
  await expect(client('https://example.com/private')).rejects.toThrow();
  await expect(client('auth/login')).rejects.toThrow();
  await expect(client('auth/refresh')).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
