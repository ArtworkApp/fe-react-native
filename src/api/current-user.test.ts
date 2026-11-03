import { getCurrentUser } from './current-user';

const user = { id: 'user-1', email: 'person@example.com', displayName: null, avatarUrl: null };
const originalUrl = process.env.EXPO_PUBLIC_API_URL;

beforeEach(() => { process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1'; });
afterEach(() => { process.env.EXPO_PUBLIC_API_URL = originalUrl; jest.restoreAllMocks(); });

test('sends the access token and returns the user profile', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true, status: 200, json: async () => ({ user }),
  } as Response);

  await expect(getCurrentUser('access.jwt')).resolves.toEqual({ state: 'authenticated', user });
  expect(fetchMock).toHaveBeenCalledWith('http://192.168.1.8:3001/api/v1/auth/me', {
    method: 'GET', headers: { Authorization: 'Bearer access.jwt' },
  });
});

test('identifies an expired or rejected access token', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 401 } as Response);
  await expect(getCurrentUser('expired.jwt')).resolves.toEqual({ state: 'unauthorized' });
});

test('does not treat a server failure as an expired token', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 503 } as Response);
  await expect(getCurrentUser('access.jwt')).rejects.toThrow();
});

test('rejects a malformed profile response', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true, status: 200, json: async () => ({ user: { id: 'user-1' } }),
  } as Response);
  await expect(getCurrentUser('access.jwt')).rejects.toThrow();
});

test('propagates a network failure for retry', async () => {
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network error'));
  await expect(getCurrentUser('access.jwt')).rejects.toThrow('Network error');
});
