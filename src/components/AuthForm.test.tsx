import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AuthApiError } from '../api/auth';
import { AuthForm } from './AuthForm';

const submitCredentials = jest.fn();
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

beforeEach(() => submitCredentials.mockReset());

test('sign-in validates email and password before submitting', async () => {
  await render(<AuthForm mode="login" onSubmit={submitCredentials} onAuthenticated={jest.fn()} />);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'invalid');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'short');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
  expect(screen.getByText('Password must be at least 12 characters.')).toBeTruthy();
  expect(submitCredentials).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Email').props.keyboardType).toBe('email-address');
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
});

test('sign-up checks confirmation locally and sends only email/password', async () => {
  const onAuthenticated = jest.fn();
  submitCredentials.mockResolvedValue(session);
  await render(<AuthForm mode="register" onSubmit={submitCredentials} onAuthenticated={onAuthenticated} />);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'Person@Example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'long-example-password');
  await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'different-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

  expect(await screen.findByText('Passwords do not match.')).toBeTruthy();
  expect(submitCredentials).not.toHaveBeenCalled();

  await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'long-example-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

  await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(session));
  expect(submitCredentials).toHaveBeenCalledWith({
    email: 'Person@Example.com',
    password: 'long-example-password',
  });
});

test('an invalid credential response stays on the form and clears the password', async () => {
  submitCredentials.mockRejectedValue(new AuthApiError({
    status: 401,
    code: 'INVALID_CREDENTIALS',
    message: 'Email or password is incorrect.',
  }));
  await render(<AuthForm mode="login" onSubmit={submitCredentials} onAuthenticated={jest.fn()} />);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'person@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'long-example-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByText('Email or password is incorrect.')).toBeTruthy();
  expect(screen.getByLabelText('Email').props.value).toBe('person@example.com');
  expect(screen.getByLabelText('Password').props.value).toBe('');
});

test('shows backend validation beside its field', async () => {
  submitCredentials.mockRejectedValue(new AuthApiError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Check your input.',
    fields: { email: ['Email is not accepted.'] },
  }));
  await render(<AuthForm mode="register" onSubmit={submitCredentials} onAuthenticated={jest.fn()} />);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'person@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'long-example-password');
  await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'long-example-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));

  expect(await screen.findByText('Email is not accepted.')).toBeTruthy();
});

test('network failure preserves email, clears password, and permits retry', async () => {
  submitCredentials.mockRejectedValueOnce(new TypeError('Network request failed'));
  submitCredentials.mockResolvedValueOnce(session);
  const onAuthenticated = jest.fn();
  await render(<AuthForm mode="login" onSubmit={submitCredentials} onAuthenticated={onAuthenticated} />);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'person@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'long-example-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByText('Unable to connect. Please try again.')).toBeTruthy();
  expect(screen.getByLabelText('Email').props.value).toBe('person@example.com');
  expect(screen.getByLabelText('Password').props.value).toBe('');

  await fireEvent.changeText(screen.getByLabelText('Password'), 'long-example-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(session));
});

test('ignores a second tap while sign-in is pending', async () => {
  submitCredentials.mockImplementation(() => new Promise(() => undefined));
  await render(<AuthForm mode="login" onSubmit={submitCredentials} onAuthenticated={jest.fn()} />);

  await fireEvent.changeText(screen.getByLabelText('Email'), 'person@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'long-example-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  await waitFor(() => expect(submitCredentials).toHaveBeenCalledTimes(1));
});
