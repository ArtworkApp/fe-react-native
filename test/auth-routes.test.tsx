import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { authenticate } from '../src/api/auth';
import { AuthSessionProvider, useAuthSession } from '../src/auth/AuthSessionProvider';
import LoginScreen from '../src/app/(auth)/login';
import RegisterScreen from '../src/app/(auth)/register';

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => ({ replace: mockReplace, back: mockBack, canGoBack: mockCanGoBack }),
}));
jest.mock('../src/api/auth', () => ({
  ...jest.requireActual('../src/api/auth'),
  authenticate: jest.fn(),
}));

const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
const session = {
  user: {
    id: '8d15334b-61d2-4aca-99b8-d633523d098b',
    email: 'person@example.com',
    displayName: null,
    avatarUrl: null,
  },
  accessToken: 'access.jwt',
  refreshToken: 'refresh.jwt',
};

function UserProbe() {
  const { user } = useAuthSession();
  return <Text>{user?.email ?? 'Signed out'}</Text>;
}

beforeEach(() => {
  mockAuthenticate.mockReset();
  mockReplace.mockReset();
  mockBack.mockReset();
  mockCanGoBack.mockReset().mockReturnValue(true);
});

test('login accepts the mobile session and returns to the previous screen', async () => {
  mockAuthenticate.mockResolvedValue(session);
  await render(<AuthSessionProvider><LoginScreen /><UserProbe /></AuthSessionProvider>);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'Person@Example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'long-example-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  await waitFor(() => expect(mockAuthenticate).toHaveBeenCalledWith('login', {
    email: 'Person@Example.com',
    password: 'long-example-password',
  }));
  await waitFor(() => expect(screen.getByText('person@example.com')).toBeTruthy());
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
});

test('registration returns to the previous screen', async () => {
  mockAuthenticate.mockResolvedValue(session);
  await render(<AuthSessionProvider><RegisterScreen /></AuthSessionProvider>);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'person@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'long-example-password');
  await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'long-example-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

  await waitFor(() => expect(mockAuthenticate).toHaveBeenCalledWith('register', {
    email: 'person@example.com',
    password: 'long-example-password',
  }));
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
});

test('falls back to the home screen when there is no previous screen', async () => {
  mockCanGoBack.mockReturnValue(false);
  mockAuthenticate.mockResolvedValue(session);
  await render(<AuthSessionProvider><LoginScreen /></AuthSessionProvider>);
  await fireEvent.changeText(screen.getByLabelText('Email'), 'person@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'long-example-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
});
