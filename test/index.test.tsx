import { fireEvent, render, screen } from '@testing-library/react-native';
import HomeScreen from '../src/app/index';
import { AuthSessionProvider, useAuthSession } from '../src/auth/AuthSessionProvider';
import { Pressable, Text } from 'react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('../src/auth/session-storage', () => ({
  saveTokens: jest.fn().mockResolvedValue(undefined),
  clearTokens: jest.fn().mockResolvedValue(undefined),
}));

afterEach(() => mockPush.mockClear());

function SignedInHome() {
  const { acceptSession } = useAuthSession();
  return <><Pressable accessibilityLabel="Set session" onPress={() => acceptSession({
    user: { id: '1', email: 'person@example.com', displayName: null, avatarUrl: null },
    accessToken: 'access.jwt', refreshToken: 'refresh.jwt',
  })}><Text>Set session</Text></Pressable><HomeScreen /></>;
}

test('home opens the artwork listing route', async () => {
  await render(<AuthSessionProvider><HomeScreen /></AuthSessionProvider>);

  await fireEvent.press(screen.getByRole('button', { name: 'Browse Art' }));

  expect(mockPush).toHaveBeenCalledWith('/artworks');
});

test('home opens the sign-in route', async () => {
  await render(<AuthSessionProvider><HomeScreen /></AuthSessionProvider>);

  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(mockPush).toHaveBeenCalledWith('/login');
});

test('home does not fetch artworks', async () => {
  await render(<AuthSessionProvider><HomeScreen /></AuthSessionProvider>);

  expect(screen.queryByTestId('artwork-grid')).toBeNull();
});

test('shows profile instead of sign in for an authenticated user', async () => {
  await render(<AuthSessionProvider><SignedInHome /></AuthSessionProvider>);
  await fireEvent.press(screen.getByLabelText('Set session'));
  expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Profile' }));
  expect(mockPush).toHaveBeenCalledWith('/account');
});
