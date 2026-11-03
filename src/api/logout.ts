import { apiUrl } from './base-url';

export async function revokeSession(refreshToken: string): Promise<boolean> {
  const response = await fetch(new URL('auth/logout', apiUrl()).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return response.ok || response.status === 401;
}
