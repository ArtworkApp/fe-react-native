import { AuthApiError } from '../api/auth-contract';
import { requestErrorMessage } from './form';

test.each([
  ['EMAIL_ALREADY_EXISTS', 'This email is already registered. Sign in instead.'],
  ['INVALID_CREDENTIALS', 'Email or password is incorrect.'],
  ['RATE_LIMITED', 'Too many attempts. Please try again later.'],
  ['VALIDATION_ERROR', 'Please check your email and password.'],
])('maps %s to a safe form message', (code, message) => {
  const error = new AuthApiError({ status: 400, code, message: 'Server detail' });
  expect(requestErrorMessage(error)).toBe(message);
});

test('shows retry feedback for a network failure', () => {
  expect(requestErrorMessage(new TypeError('Network request failed'))).toBe(
    'Unable to connect. Please try again.',
  );
});
