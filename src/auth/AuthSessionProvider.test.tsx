import { fireEvent, render, screen } from '@testing-library/react-native';
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
  const { user, acceptSession } = useAuthSession();
  return (
    <>
      <Text>{user?.email ?? 'Signed out'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Accept session"
        onPress={() => acceptSession(session)}>
        <Text>Accept session</Text>
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
