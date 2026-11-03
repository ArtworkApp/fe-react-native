import { fireEvent, render, screen } from '@testing-library/react-native';
import HomeScreen from '../src/app/index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

afterEach(() => mockPush.mockClear());

test('home opens the artwork listing route', async () => {
  await render(<HomeScreen />);

  await fireEvent.press(screen.getByRole('button', { name: 'Browse Art' }));

  expect(mockPush).toHaveBeenCalledWith('/artworks');
});

test('home opens the sign-in route', async () => {
  await render(<HomeScreen />);

  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(mockPush).toHaveBeenCalledWith('/login');
});

test('home does not fetch artworks', async () => {
  await render(<HomeScreen />);

  expect(screen.queryByTestId('artwork-grid')).toBeNull();
});
