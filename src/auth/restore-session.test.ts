import { getCurrentUser } from '../api/current-user';
import { refreshSession } from '../api/refresh-session';
import { clearTokens, loadTokens, saveTokens } from './session-storage';
import { restoreSession } from './restore-session';

jest.mock('../api/current-user');
jest.mock('../api/refresh-session');
jest.mock('./session-storage');

const user = { id: 'user-1', email: 'person@example.com', displayName: null, avatarUrl: null };
const tokens = { accessToken: 'old.access', refreshToken: 'old.refresh' };
const rotated = { user, accessToken: 'new.access', refreshToken: 'new.refresh' };

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(loadTokens).mockResolvedValue(tokens);
  jest.mocked(clearTokens).mockResolvedValue(undefined);
  jest.mocked(saveTokens).mockResolvedValue(undefined);
});

test('returns anonymous when no credentials are stored', async () => {
  jest.mocked(loadTokens).mockResolvedValue(null);
  await expect(restoreSession()).resolves.toEqual({ state: 'anonymous' });
  expect(getCurrentUser).not.toHaveBeenCalled();
});

test('restores a session after verifying the stored access token', async () => {
  jest.mocked(getCurrentUser).mockResolvedValue({ state: 'authenticated', user });
  await expect(restoreSession()).resolves.toEqual({ state: 'authenticated', session: { ...tokens, user } });
  expect(getCurrentUser).toHaveBeenCalledWith(tokens.accessToken);
  expect(refreshSession).not.toHaveBeenCalled();
});

test('refreshes expired access and saves rotated tokens before restoring', async () => {
  jest.mocked(getCurrentUser).mockResolvedValue({ state: 'unauthorized' });
  jest.mocked(refreshSession).mockResolvedValue({ state: 'authenticated', session: rotated });
  await expect(restoreSession()).resolves.toEqual({ state: 'authenticated', session: rotated });
  expect(refreshSession).toHaveBeenCalledWith(tokens.refreshToken);
  expect(saveTokens).toHaveBeenCalledWith({ accessToken: rotated.accessToken, refreshToken: rotated.refreshToken });
});

test('clears credentials when the refresh token is rejected', async () => {
  jest.mocked(getCurrentUser).mockResolvedValue({ state: 'unauthorized' });
  jest.mocked(refreshSession).mockResolvedValue({ state: 'unauthorized' });
  await expect(restoreSession()).resolves.toEqual({ state: 'anonymous' });
  expect(clearTokens).toHaveBeenCalledTimes(1);
});

test('keeps credentials when verification fails temporarily', async () => {
  jest.mocked(getCurrentUser).mockRejectedValue(new TypeError('Network error'));
  await expect(restoreSession()).resolves.toEqual({ state: 'retry' });
  expect(clearTokens).not.toHaveBeenCalled();
  expect(refreshSession).not.toHaveBeenCalled();
});

test('does not authenticate if rotated tokens cannot be saved', async () => {
  jest.mocked(getCurrentUser).mockResolvedValue({ state: 'unauthorized' });
  jest.mocked(refreshSession).mockResolvedValue({ state: 'authenticated', session: rotated });
  jest.mocked(saveTokens).mockRejectedValue(new Error('Storage unavailable'));
  await expect(restoreSession()).resolves.toEqual({ state: 'retry' });
});
