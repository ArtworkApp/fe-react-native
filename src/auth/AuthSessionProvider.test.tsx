import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import type { MobileSession } from '../api/auth';
import { AuthSessionProvider, useAuthSession } from './AuthSessionProvider';

const session: MobileSession = {
  user: {
    id: '8d15334b-61d2-4aca-99b8-d633523d098b',
    email: 'person@example.com',
    displayName: null,
    avatarUrl: null,
  },
  accessToken: 'access.jwt',
  refreshToken: 'refresh.jwt',
};

function SessionProbe() {
  const { user, acceptSession, signOut, signOutWarning } = useAuthSession();
  return (
    <>
      <Text>{user?.email ?? 'Signed out'}</Text>
      {signOutWarning ? <Text>{signOutWarning}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Accept session"
        onPress={() => acceptSession(session)}>
        <Text>Accept session</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Sign out"
        onPress={() => { void signOut(); }}>
        <Text>Sign out</Text>
      </Pressable>
    </>
  );
}

test('keeps a successful mobile session in memory for route handoff', async () => {
  await render(<AuthSessionProvider><SessionProbe /></AuthSessionProvider>);

  expect(screen.getByText('Signed out')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Accept session' }));
  expect(screen.getByText('person@example.com')).toBeTruthy();
});

test('sign-out clears the session and revokes the refresh token', async () => {
  process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
  const request = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 204 } as Response);
  await render(<AuthSessionProvider><SessionProbe /></AuthSessionProvider>);
  await fireEvent.press(screen.getByRole('button', { name: 'Accept session' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  expect(screen.getByText('Signed out')).toBeTruthy();
  expect(request).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), expect.objectContaining({
    method: 'POST', body: JSON.stringify({ refreshToken: 'refresh.jwt' }),
  }));
  request.mockRestore();
});

test('warns when the server cannot confirm sign-out', async () => {
  process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.8:3001/api/v1';
  const request = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
  await render(<AuthSessionProvider><SessionProbe /></AuthSessionProvider>);
  await fireEvent.press(screen.getByRole('button', { name: 'Accept session' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() => expect(screen.getByText('Could not confirm sign-out with the server.')).toBeTruthy());
  expect(screen.getByText('Signed out')).toBeTruthy();
  request.mockRestore();
});
