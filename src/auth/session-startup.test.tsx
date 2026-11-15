import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { AuthSessionProvider, useAuthSession } from './AuthSessionProvider';
import { restoreSession } from './restore-session';

jest.mock('./restore-session');

const session = {
  user: { id: 'user-1', email: 'person@example.com', displayName: null, avatarUrl: null },
  accessToken: 'access.jwt',
  refreshToken: 'refresh.jwt',
};

function StartupProbe() {
  const { user, restorationState, retryRestoration, signOutWarning } = useAuthSession();
  if (restorationState === 'loading') return <Text>Checking session</Text>;
  if (restorationState === 'retry') {
    return <Pressable accessibilityRole="button" onPress={retryRestoration}><Text>Retry session</Text></Pressable>;
  }
  return <><Text>{user?.email ?? 'Signed out'}</Text>{signOutWarning ? <Text>{signOutWarning}</Text> : null}</>;
}

beforeEach(() => jest.mocked(restoreSession).mockReset());

test('keeps the session pending until verification finishes', async () => {
  let finish: (value: { state: 'authenticated'; session: typeof session }) => void = () => {};
  jest.mocked(restoreSession).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  await render(<AuthSessionProvider><StartupProbe /></AuthSessionProvider>);
  expect(screen.getByText('Checking session')).toBeTruthy();
  expect(screen.queryByText('person@example.com')).toBeNull();
  finish({ state: 'authenticated', session });
  await waitFor(() => expect(screen.getByText('person@example.com')).toBeTruthy());
});

test('allows retry after a temporary restoration failure', async () => {
  jest.mocked(restoreSession)
    .mockResolvedValueOnce({ state: 'retry' })
    .mockResolvedValueOnce({ state: 'authenticated', session });
  await render(<AuthSessionProvider><StartupProbe /></AuthSessionProvider>);
  await fireEvent.press(await screen.findByRole('button', { name: 'Retry session' }));
  await waitFor(() => expect(screen.getByText('person@example.com')).toBeTruthy());
  expect(restoreSession).toHaveBeenCalledTimes(2);
});

test('shows signed out when no session can be restored', async () => {
  jest.mocked(restoreSession).mockResolvedValue({ state: 'anonymous' });
  await render(<AuthSessionProvider><StartupProbe /></AuthSessionProvider>);
  expect(await screen.findByText('Signed out')).toBeTruthy();
});

test('asks for sign-in when a refresh outcome is uncertain', async () => {
  jest.mocked(restoreSession).mockResolvedValue({ state: 'uncertain' });
  await render(<AuthSessionProvider><StartupProbe /></AuthSessionProvider>);
  expect(await screen.findByText('Your session could not be restored. Please sign in again.')).toBeTruthy();
  expect(screen.getByText('Signed out')).toBeTruthy();
});
