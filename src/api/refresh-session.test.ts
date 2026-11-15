import { refreshSession } from './refresh-session';

const session = {
  user: { id: 'user-1', email: 'person@example.com', displayName: null, avatarUrl: null },
  accessToken: 'new.access',
  refreshToken: 'new.refresh',
};
const originalUrl = process.env.EXPO_PUBLIC_API_URL;

beforeEach(() => { process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1'; });
afterEach(() => { process.env.EXPO_PUBLIC_API_URL = originalUrl; jest.restoreAllMocks(); });

test('exchanges a refresh token for a new mobile session', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true, status: 200, json: async () => session,
  } as Response);
  await expect(refreshSession('old.refresh')).resolves.toEqual({ state: 'authenticated', session });
  expect(fetchMock).toHaveBeenCalledWith('http://192.168.1.8:3001/api/v1/auth/refresh', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: 'old.refresh' }),
  });
});

test('identifies a rejected refresh token', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 401 } as Response);
  await expect(refreshSession('old.refresh')).resolves.toEqual({ state: 'unauthorized' });
});

test('treats a server failure as retryable', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 503 } as Response);
  await expect(refreshSession('old.refresh')).rejects.toThrow();
});

test('rejects a malformed successful session', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true, status: 200, json: async () => ({ user: session.user, accessToken: 'new.access' }),
  } as Response);
  await expect(refreshSession('old.refresh')).rejects.toThrow();
});

test('propagates a network failure', async () => {
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network error'));
  await expect(refreshSession('old.refresh')).rejects.toThrow('Network error');
});
