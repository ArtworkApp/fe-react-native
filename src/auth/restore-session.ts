import { getCurrentUser } from '../api/current-user';
import { refreshSession } from '../api/refresh-session';
import type { MobileSession } from '../api/auth';
import { clearTokens, loadTokens, markRefreshPending, saveTokens, type SessionTokens } from './session-storage';

type RestorationResult =
  | { state: 'authenticated'; session: MobileSession }
  | { state: 'anonymous' }
  | { state: 'uncertain' }
  | { state: 'retry' };

async function restoreWithRefresh(tokens: SessionTokens): Promise<RestorationResult> {
  await markRefreshPending(tokens);
  let result: Awaited<ReturnType<typeof refreshSession>>;
  try {
    result = await refreshSession(tokens.refreshToken);
  } catch {
    return { state: 'uncertain' };
  }
  if (result.state === 'unauthorized') {
    await clearTokens();
    return { state: 'anonymous' };
  }

  const { accessToken, refreshToken } = result.session;
  try {
    await saveTokens({ accessToken, refreshToken });
  } catch {
    return { state: 'uncertain' };
  }
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
    if (tokens.refreshPending) return { state: 'uncertain' };
    return await verifyStoredSession(tokens);
  } catch {
    return { state: 'retry' };
  }
}
