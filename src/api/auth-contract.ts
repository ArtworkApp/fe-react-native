import { z } from 'zod';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface MobileSession {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export type AuthOperation = 'login' | 'register';

export interface AuthHttpResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

interface AuthErrorOptions {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string[]>;

  constructor(options: AuthErrorOptions) {
    super(options.message);
    this.name = 'AuthApiError';
    this.status = options.status;
    this.code = options.code;
    this.fields = options.fields;
  }
}

const userProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

const mobileSessionSchema = z.object({
  user: userProfileSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

const errorBodySchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      fields: z.record(z.string(), z.array(z.string()).catch([])).optional(),
    }),
  })
  .transform(({ error }) => error)
  .catch({ code: 'REQUEST_FAILED', message: 'Unable to sign in right now.' });

function parseMobileSession(body: unknown): MobileSession {
  const result = mobileSessionSchema.safeParse(body);
  if (!result.success) throw new Error('Invalid authentication response.');
  return result.data;
}

function parseAuthenticationError(response: AuthHttpResponse): AuthApiError {
  return new AuthApiError({
    status: response.status,
    ...errorBodySchema.parse(response.body),
  });
}

export function parseAuthenticationResponse(response: AuthHttpResponse): MobileSession {
  if (!response.ok) throw parseAuthenticationError(response);
  return parseMobileSession(response.body);
}

