import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { refreshSession } from '../api/refresh-session';
import { revokeSession } from '../api/logout';
import { AuthSessionProvider, useAuthSession } from './AuthSessionProvider';
import { clearTokens, markRefreshPending, saveTokens } from './session-storage';

jest.mock('./restore-session', () => ({ restoreSession: jest.fn().mockResolvedValue({ state: 'anonymous' }) }));
jest.mock('./session-storage', () => ({ saveTokens: jest.fn(), clearTokens: jest.fn(), markRefreshPending: jest.fn() }));
jest.mock('../api/refresh-session');
jest.mock('../api/logout');

const user = { id: 'user-1', email: 'person@example.com', displayName: null, avatarUrl: null };
const initial = { user, accessToken: 'old.access', refreshToken: 'old.refresh' };
const rotated = { user, accessToken: 'new.access', refreshToken: 'new.refresh' };

function SessionProbe() {
  const { user: currentUser, acceptSession, authenticatedFetch, signOut } = useAuthSession();
  return <>
    <Text>{currentUser?.email ?? 'Signed out'}</Text>
    <Pressable accessibilityRole="button" onPress={() => acceptSession(initial)}><Text>Sign in</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => { void authenticatedFetch('private'); }}>
      <Text>Request</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={() => { void signOut(); }}><Text>Sign out</Text></Pressable>
  </>;
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
  jest.mocked(saveTokens).mockReset().mockResolvedValue(undefined);
  jest.mocked(clearTokens).mockReset().mockResolvedValue(undefined);
  jest.mocked(markRefreshPending).mockReset().mockResolvedValue(undefined);
  jest.mocked(refreshSession).mockReset();
  jest.mocked(revokeSession).mockReset().mockResolvedValue(true);
});

test('does not restore a session when sign-out happens during refresh', async () => {
  let finish: (value: { state: 'authenticated'; session: typeof rotated }) => void = () => {};
  jest.mocked(refreshSession).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ status: 401 } as Response);
  await render(<AuthSessionProvider><SessionProbe /></AuthSessionProvider>);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Request' }));
  await waitFor(() => expect(refreshSession).toHaveBeenCalledTimes(1));
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  finish({ state: 'authenticated', session: rotated });
  await waitFor(() => expect(screen.getByText('Signed out')).toBeTruthy());
  expect(request).toHaveBeenCalledTimes(1);
  expect(saveTokens).not.toHaveBeenCalledWith({ accessToken: 'new.access', refreshToken: 'new.refresh' });
});
afterEach(() => jest.restoreAllMocks());

test('persists rotated tokens before retrying an authenticated request', async () => {
  jest.mocked(refreshSession).mockResolvedValue({ state: 'authenticated', session: rotated });
  const request = jest.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce({ status: 401 } as Response)
    .mockResolvedValueOnce({ status: 200 } as Response);
  await render(<AuthSessionProvider><SessionProbe /></AuthSessionProvider>);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Request' }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  expect(markRefreshPending).toHaveBeenCalledWith({ accessToken: 'old.access', refreshToken: 'old.refresh' });
  expect(refreshSession).toHaveBeenCalledWith('old.refresh');
  expect(saveTokens).toHaveBeenLastCalledWith({ accessToken: 'new.access', refreshToken: 'new.refresh' });
  expect(jest.mocked(saveTokens).mock.invocationCallOrder[1]).toBeLessThan(request.mock.invocationCallOrder[1]);
  expect((request.mock.calls[1][1]?.headers as Headers).get('Authorization')).toBe('Bearer new.access');
});

test('signs out and clears stored tokens when refresh is rejected', async () => {
  jest.mocked(refreshSession).mockResolvedValue({ state: 'unauthorized' });
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ status: 401 } as Response);
  await render(<AuthSessionProvider><SessionProbe /></AuthSessionProvider>);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Request' }));
  await waitFor(() => expect(screen.getByText('Signed out')).toBeTruthy());
  expect(clearTokens).toHaveBeenCalled();
});
