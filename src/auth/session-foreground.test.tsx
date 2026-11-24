import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Pressable, Text, type AppStateStatus } from 'react-native';
import { getCurrentUser } from '../api/current-user';
import { refreshSession } from '../api/refresh-session';
import { revokeSession } from '../api/logout';
import { AuthSessionProvider, useAuthSession } from './AuthSessionProvider';
import { restoreSession } from './restore-session';
import { clearTokens, markRefreshPending, saveTokens } from './session-storage';

jest.mock('./restore-session');
jest.mock('../api/current-user');
jest.mock('../api/refresh-session');
jest.mock('../api/logout');
jest.mock('./session-storage', () => ({ clearTokens: jest.fn(), markRefreshPending: jest.fn(), saveTokens: jest.fn() }));

const user = { id: 'user-1', email: 'person@example.com', displayName: null, avatarUrl: null };
const session = { user, accessToken: 'access.jwt', refreshToken: 'refresh.jwt' };
let changeState: (state: AppStateStatus) => void;

function Probe() {
  const { user: currentUser, restorationState, retryRestoration, signOutWarning, signOut, authenticatedFetch } = useAuthSession();
  if (restorationState === 'loading') return <><Text>Checking session</Text><Pressable accessibilityRole="button" onPress={() => { void signOut(); }}><Text>Sign out</Text></Pressable></>;
  if (restorationState === 'retry') return <Pressable accessibilityRole="button" onPress={retryRestoration}><Text>Retry session</Text></Pressable>;
  return <><Text>{currentUser?.email ?? 'Signed out'}</Text>{signOutWarning ? <Text>{signOutWarning}</Text> : null}<Pressable accessibilityRole="button" onPress={() => { void signOut(); }}><Text>Sign out</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { void authenticatedFetch('private'); }}><Text>Request</Text></Pressable></>;
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
  jest.mocked(restoreSession).mockReset().mockResolvedValue({ state: 'authenticated', session });
  jest.mocked(getCurrentUser).mockReset();
  jest.mocked(refreshSession).mockReset();
  jest.mocked(clearTokens).mockReset().mockResolvedValue(undefined);
  jest.mocked(markRefreshPending).mockReset().mockResolvedValue(undefined);
  jest.mocked(saveTokens).mockReset().mockResolvedValue(undefined);
  jest.mocked(revokeSession).mockReset().mockResolvedValue(true);
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    changeState = listener;
    return { remove: jest.fn() };
  });
});
afterEach(() => jest.restoreAllMocks());

async function returnToApp(): Promise<void> {
  await act(async () => { changeState('background'); changeState('active'); });
}

test('checks the session on return and signs out after a rejected refresh', async () => {
  jest.mocked(getCurrentUser).mockResolvedValue({ state: 'unauthorized' });
  jest.mocked(refreshSession).mockResolvedValue({ state: 'unauthorized' });
  await render(<AuthSessionProvider><Probe /></AuthSessionProvider>);
  expect(await screen.findByText('person@example.com')).toBeTruthy();
  await returnToApp();
  expect(await screen.findByText('Signed out')).toBeTruthy();
  expect(screen.getByText('Your session could not be restored. Please sign in again.')).toBeTruthy();
  expect(clearTokens).toHaveBeenCalled();
});

test('hides private content while the session is being checked', async () => {
  let finish: (value: { state: 'authenticated'; user: typeof user }) => void = () => {};
  jest.mocked(getCurrentUser).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  await render(<AuthSessionProvider><Probe /></AuthSessionProvider>);
  expect(await screen.findByText('person@example.com')).toBeTruthy();
  await returnToApp();
  expect(screen.getByText('Checking session')).toBeTruthy();
  expect(screen.queryByText('person@example.com')).toBeNull();
  await act(async () => finish({ state: 'authenticated', user }));
  await waitFor(() => expect(screen.getByText('person@example.com')).toBeTruthy());
});

test('offers retry when the verification network request fails', async () => {
  jest.mocked(getCurrentUser).mockRejectedValue(new Error('offline'));
  await render(<AuthSessionProvider><Probe /></AuthSessionProvider>);
  expect(await screen.findByText('person@example.com')).toBeTruthy();
  await returnToApp();
  expect(await screen.findByRole('button', { name: 'Retry session' })).toBeTruthy();
});

test('does not restore an old session when sign-out occurs during verification', async () => {
  let rejectCheck: (reason: Error) => void = () => {};
  jest.mocked(getCurrentUser).mockReturnValue(new Promise((_resolve, reject) => { rejectCheck = reject; }));
  await render(<AuthSessionProvider><Probe /></AuthSessionProvider>);
  expect(await screen.findByText('person@example.com')).toBeTruthy();
  await returnToApp();
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  await act(async () => rejectCheck(new Error('offline')));
  expect(await screen.findByText('Signed out')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Retry session' })).toBeNull();
});

test('shares one refresh between foreground verification and an authenticated request', async () => {
  let finish: (value: { state: 'authenticated'; session: typeof session }) => void = () => {};
  jest.mocked(refreshSession).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  jest.mocked(getCurrentUser).mockResolvedValue({ state: 'unauthorized' });
  jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ status: 401 } as Response).mockResolvedValueOnce({ status: 200 } as Response);
  await render(<AuthSessionProvider><Probe /></AuthSessionProvider>);
  expect(await screen.findByText('person@example.com')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Request' }));
  await waitFor(() => expect(refreshSession).toHaveBeenCalledTimes(1));
  await returnToApp();
  expect(refreshSession).toHaveBeenCalledTimes(1);
  await act(async () => finish({ state: 'authenticated', session: { ...session, accessToken: 'new.access', refreshToken: 'new.refresh' } }));
  await waitFor(() => expect(screen.getByText('person@example.com')).toBeTruthy());
  expect(refreshSession).toHaveBeenCalledTimes(1);
});
