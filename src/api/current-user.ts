import { z } from 'zod';
import { userProfileSchema, type UserProfile } from './auth-contract';
import { apiUrl } from './base-url';

type CurrentUserResult =
  | { state: 'authenticated'; user: UserProfile }
  | { state: 'unauthorized' };

const currentUserSchema = z.object({ user: userProfileSchema });

function requestCurrentUser(accessToken: string): Promise<Response> {
  return fetch(new URL('auth/me', apiUrl()).toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function parseCurrentUser(body: unknown): UserProfile {
  return currentUserSchema.parse(body).user;
}

async function readCurrentUser(response: Response): Promise<UserProfile> {
  const body: unknown = await response.json();
  return parseCurrentUser(body);
}

export async function getCurrentUser(accessToken: string): Promise<CurrentUserResult> {
  const response = await requestCurrentUser(accessToken);
  if (response.status === 401) return { state: 'unauthorized' };
  if (!response.ok) throw new Error('Unable to verify the session.');
  const user = await readCurrentUser(response);
  return { state: 'authenticated', user };
}
