import { parseMobileSession, type MobileSession } from './auth-contract';
import { apiUrl } from './base-url';

type RefreshSessionResult =
  | { state: 'authenticated'; session: MobileSession }
  | { state: 'unauthorized' };

function requestRefresh(refreshToken: string): Promise<Response> {
  return fetch(new URL('auth/refresh', apiUrl()).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
}

async function readSession(response: Response): Promise<MobileSession> {
  const body: unknown = await response.json();
  return parseMobileSession(body);
}

export async function refreshSession(refreshToken: string): Promise<RefreshSessionResult> {
  const response = await requestRefresh(refreshToken);
  if (response.status === 401) return { state: 'unauthorized' };
  if (!response.ok) throw new Error('Unable to refresh the session.');
  const session = await readSession(response);
  return { state: 'authenticated', session };
}
