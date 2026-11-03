import { getCurrentUser } from '../api/current-user';
import { refreshSession } from '../api/refresh-session';
import type { MobileSession } from '../api/auth';
import { clearTokens, loadTokens, saveTokens, type SessionTokens } from './session-storage';

type RestorationResult =
  | { state: 'authenticated'; session: MobileSession }
  | { state: 'anonymous' }
  | { state: 'retry' };

async function restoreWithRefresh(tokens: SessionTokens): Promise<RestorationResult> {
  const result = await refreshSession(tokens.refreshToken);
  if (result.state === 'unauthorized') {
    await clearTokens();
    return { state: 'anonymous' };
  }

  const { accessToken, refreshToken } = result.session;
  await saveTokens({ accessToken, refreshToken });
  return { state: 'authenticated', session: result.session };
}

async function verifyStoredSession(tokens: SessionTokens): Promise<RestorationResult> {
  const result = await getCurrentUser(tokens.accessToken);
  if (result.state === 'unauthorized') return restoreWithRefresh(tokens);
  return { state: 'authenticated', session: { ...tokens, user: result.user } };
}

export async function restoreSession(): Promise<RestorationResult> {
  try {
    const tokens = await loadTokens();
    if (!tokens) return { state: 'anonymous' };
    return await verifyStoredSession(tokens);
  } catch {
    return { state: 'retry' };
  }
}
