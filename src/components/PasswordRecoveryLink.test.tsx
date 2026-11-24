import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import { PasswordRecoveryLink } from './PasswordRecoveryLink';

jest.mock('expo-linking', () => ({ openURL: jest.fn() }));
const originalOrigin = process.env.EXPO_PUBLIC_WEB_ORIGIN;

afterEach(() => {
  process.env.EXPO_PUBLIC_WEB_ORIGIN = originalOrigin;
  jest.clearAllMocks();
});

it('opens the configured web recovery page in the system browser', async () => {
  process.env.EXPO_PUBLIC_WEB_ORIGIN = 'https://art.example.com';
  jest.mocked(Linking.openURL).mockResolvedValue(true);
  await render(<PasswordRecoveryLink />);
  await fireEvent.press(screen.getByRole('button', { name: 'Forgot password?' }));
  expect(Linking.openURL).toHaveBeenCalledWith('https://art.example.com/forgot-password');
});

it('disables recovery and explains when the web origin is unavailable', async () => {
  delete process.env.EXPO_PUBLIC_WEB_ORIGIN;
  await render(<PasswordRecoveryLink />);
  expect(screen.getByRole('button', { name: 'Forgot password?' }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByText('Password recovery is unavailable. Please try again later.')).toBeTruthy();
  expect(Linking.openURL).not.toHaveBeenCalled();
});

it('shows retry feedback if opening the browser fails', async () => {
  process.env.EXPO_PUBLIC_WEB_ORIGIN = 'https://art.example.com';
  jest.mocked(Linking.openURL).mockRejectedValue(new Error('private browser detail'));
  await render(<PasswordRecoveryLink />);
  await fireEvent.press(screen.getByRole('button', { name: 'Forgot password?' }));
  expect(await screen.findByText('Could not open the browser. Please try again.')).toBeTruthy();
  expect(screen.queryByText('private browser detail')).toBeNull();
});
