import { fireEvent, render, screen } from '@testing-library/react-native';
import { Redirect } from 'expo-router';
import { useAuthSession } from '../src/auth/AuthSessionProvider';
import AccountScreen from '../src/app/account';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ Redirect: jest.fn(() => null), useRouter: () => ({ replace: mockReplace }) }));
jest.mock('../src/auth/AuthSessionProvider', () => ({ useAuthSession: jest.fn() }));

const mockUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;
const mockRedirect = Redirect as jest.MockedFunction<typeof Redirect>;

beforeEach(() => {
  mockUseAuthSession.mockReset();
  mockRedirect.mockClear();
});

test('keeps private content hidden while the session is being restored', async () => {
  mockUseAuthSession.mockReturnValue({ user: null, acceptSession: jest.fn(), signOut: jest.fn(),
    signOutWarning: '', restorationState: 'loading', retryRestoration: jest.fn(), authenticatedFetch: jest.fn() });
  await render(<AccountScreen />);
  expect(screen.getByText('Checking session…')).toBeTruthy();
  expect(mockRedirect).not.toHaveBeenCalled();
});

test('offers a retry when restoration cannot reach the server', async () => {
  const retryRestoration = jest.fn();
  mockUseAuthSession.mockReturnValue({ user: null, acceptSession: jest.fn(), signOut: jest.fn(),
    signOutWarning: '', restorationState: 'retry', retryRestoration, authenticatedFetch: jest.fn() });
  await render(<AccountScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry session' }));
  expect(retryRestoration).toHaveBeenCalledTimes(1);
  expect(mockRedirect).not.toHaveBeenCalled();
});

test('anonymous users cannot view the account screen', async () => {
  mockUseAuthSession.mockReturnValue({ user: null, acceptSession: jest.fn(), signOut: jest.fn(), signOutWarning: '', restorationState: 'ready', retryRestoration: jest.fn(), authenticatedFetch: jest.fn() });

  await render(<AccountScreen />);

  expect(mockRedirect).toHaveBeenCalledWith(
    expect.objectContaining({ href: '/login' }),
    undefined,
  );
  expect(screen.queryByText('person@example.com')).toBeNull();
});

test('authenticated users see their public profile', async () => {
  const signOut = jest.fn().mockResolvedValue(undefined);
  mockUseAuthSession.mockReturnValue({
    user: {
      id: '8d15334b-61d2-4aca-99b8-d633523d098b',
      email: 'person@example.com',
      displayName: null,
      avatarUrl: null,
    },
    acceptSession: jest.fn(),
    signOut,
    signOutWarning: '',
    restorationState: 'ready',
    retryRestoration: jest.fn(),
    authenticatedFetch: jest.fn(),
  });

  await render(<AccountScreen />);

  expect(screen.getByText('person@example.com')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  expect(signOut).toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith('/');
  expect(mockRedirect).not.toHaveBeenCalled();
});
