import { z } from 'zod';
import { AuthApiError } from '../api/auth-contract';

export type AuthMode = 'login' | 'register';

const credentialsSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(12, 'Password must be at least 12 characters.'),
  confirmPassword: z.string(),
});

export type FormValues = z.infer<typeof credentialsSchema>;

export function formSchema(mode: AuthMode) {
  return credentialsSchema.refine(
    (values) => mode === 'login' || values.password === values.confirmPassword,
    { path: ['confirmPassword'], message: 'Passwords do not match.' },
  );
}

export function requestErrorMessage(error: unknown): string {
  const code = error instanceof AuthApiError ? error.code : null;
  switch (code) {
    case 'EMAIL_ALREADY_EXISTS':
      return 'This email is already registered. Sign in instead.';
    case 'INVALID_CREDENTIALS':
      return 'Email or password is incorrect.';
    case 'RATE_LIMITED':
      return 'Too many attempts. Please try again later.';
    case 'VALIDATION_ERROR':
      return 'Please check your email and password.';
    default:
      return 'Unable to connect. Please try again.';
  }
}

export function serverFieldMessage(
  error: unknown,
  field: 'email' | 'password',
): string | undefined {
  return error instanceof AuthApiError ? error.fields?.[field]?.[0] : undefined;
}
