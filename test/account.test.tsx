import { render, screen } from '@testing-library/react-native';
import { Redirect } from 'expo-router';
import { useAuthSession } from '../src/auth/AuthSessionProvider';
import AccountScreen from '../src/app/account';

jest.mock('expo-router', () => ({ Redirect: jest.fn(() => null) }));
jest.mock('../src/auth/AuthSessionProvider', () => ({ useAuthSession: jest.fn() }));

const mockUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;
const mockRedirect = Redirect as jest.MockedFunction<typeof Redirect>;

beforeEach(() => {
  mockUseAuthSession.mockReset();
  mockRedirect.mockClear();
});

test('anonymous users cannot view the account screen', async () => {
  mockUseAuthSession.mockReturnValue({ user: null, acceptSession: jest.fn() });

  await render(<AccountScreen />);

  expect(mockRedirect).toHaveBeenCalledWith(
    expect.objectContaining({ href: '/login' }),
    undefined,
  );
  expect(screen.queryByText('person@example.com')).toBeNull();
});

test('authenticated users see their public profile', async () => {
  mockUseAuthSession.mockReturnValue({
    user: {
      id: '8d15334b-61d2-4aca-99b8-d633523d098b',
      email: 'person@example.com',
      displayName: null,
      avatarUrl: null,
    },
    acceptSession: jest.fn(),
  });

  await render(<AccountScreen />);

  expect(screen.getByText('person@example.com')).toBeTruthy();
  expect(mockRedirect).not.toHaveBeenCalled();
});
