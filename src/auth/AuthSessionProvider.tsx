import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { MobileSession, UserProfile } from '../api/auth';
import { revokeSession } from '../api/logout';
import { createAuthenticatedFetch } from '../api/authenticated-fetch';
import { refreshSession } from '../api/refresh-session';
import { clearTokens, markRefreshPending, saveTokens, type SessionTokens } from './session-storage';
import { restoreSession } from './restore-session';

type RestorationState = 'loading' | 'retry' | 'ready';

interface AuthSessionContextValue {
  user: UserProfile | null;
  acceptSession: (session: MobileSession) => Promise<void>;
  signOut: () => Promise<void>;
  signOutWarning: string;
  restorationState: RestorationState;
  retryRestoration: () => void;
  authenticatedFetch: ReturnType<typeof createAuthenticatedFetch>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<MobileSession | null>(null);
  const sessionRef = useRef<MobileSession | null>(null);
  const sessionVersion = useRef(0);
  const storageQueue = useRef<Promise<void>>(Promise.resolve());
  const [signOutWarning, setSignOutWarning] = useState('');
  const [restorationState, setRestorationState] = useState<RestorationState>('loading');
  const restoration = useRef<ReturnType<typeof restoreSession> | null>(null);

  const retryRestoration = useCallback((): void => {
    if (restoration.current) return;
    setRestorationState('loading');
    const pending = restoreSession();
    restoration.current = pending;
    void pending.then((result) => {
      if (restoration.current !== pending) return;
      restoration.current = null;
      if (result.state === 'retry') {
        setRestorationState('retry');
        return;
      }
      if (result.state === 'uncertain') {
        setSignOutWarning('Your session could not be restored. Please sign in again.');
      }
      const restored = result.state === 'authenticated' ? result.session : null;
      sessionRef.current = restored;
      setCurrentSession(restored);
      setRestorationState('ready');
    }).catch(() => {
      if (restoration.current !== pending) return;
      restoration.current = null;
      setRestorationState('retry');
    });
  }, []);

  useEffect(() => { retryRestoration(); }, [retryRestoration]);

  function queueStorage<T>(operation: () => Promise<T>): Promise<T> {
    const task = storageQueue.current.then(operation);
    storageQueue.current = task.then(() => undefined, () => undefined);
    return task;
  }

  function updateSession(session: MobileSession | null): void {
    sessionRef.current = session;
    setCurrentSession(session);
  }

  function isCurrentSession(version: number): boolean {
    return sessionVersion.current === version && sessionRef.current !== null;
  }

  async function invalidateSession(): Promise<void> {
    sessionVersion.current++;
    updateSession(null);
    try {
      await queueStorage(clearTokens);
    } catch {
      setSignOutWarning('Could not remove saved credentials from this device.');
    }
  }

  function requireSignInAgain(version: number): void {
    if (!isCurrentSession(version)) return;
    sessionVersion.current++;
    updateSession(null);
    setSignOutWarning('Your session could not be restored. Please sign in again.');
  }

  async function rotateActiveSession(): Promise<SessionTokens | null> {
    const session = sessionRef.current;
    if (!session) return null;
    const version = sessionVersion.current;
    const tokens = { accessToken: session.accessToken, refreshToken: session.refreshToken };
    const marked = await queueStorage(async () => {
      if (!isCurrentSession(version)) return false;
      await markRefreshPending(tokens);
      return true;
    });
    if (!marked || !isCurrentSession(version)) return null;

    let result: Awaited<ReturnType<typeof refreshSession>>;
    try {
      result = await refreshSession(tokens.refreshToken);
    } catch {
      requireSignInAgain(version);
      return null;
    }
    if (!isCurrentSession(version)) return null;
    if (result.state === 'unauthorized') {
      await invalidateSession();
      return null;
    }

    const refreshed = result.session;
    const rotated = { accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken };
    try {
      const stored = await queueStorage(async () => {
        if (!isCurrentSession(version)) return false;
        await saveTokens(rotated);
        return isCurrentSession(version);
      });
      if (!stored || !isCurrentSession(version)) return null;
    } catch {
      requireSignInAgain(version);
      return null;
    }
    updateSession(refreshed);
    return rotated;
  }

  const authenticatedFetch = useRef<ReturnType<typeof createAuthenticatedFetch> | null>(null);
  if (!authenticatedFetch.current) {
    authenticatedFetch.current = createAuthenticatedFetch({
      getTokens: () => sessionRef.current,
      refresh: rotateActiveSession,
      invalidate: invalidateSession,
    });
  }

  async function signOut(): Promise<void> {
    const session = sessionRef.current;
    if (!session) return;
    sessionVersion.current++;
    updateSession(null);
    setSignOutWarning('');
    let storageCleared = true;
    try {
      await queueStorage(clearTokens);
    } catch {
      storageCleared = false;
    }
    try {
      if (!await revokeSession(session.refreshToken)) {
        setSignOutWarning('Could not confirm sign-out with the server.');
      }
    } catch {
      setSignOutWarning('Could not confirm sign-out with the server.');
    }
    if (!storageCleared) setSignOutWarning('Could not remove saved credentials from this device.');
  }

  async function acceptSession(session: MobileSession): Promise<void> {
    const version = ++sessionVersion.current;
    await queueStorage(async () => {
      if (sessionVersion.current !== version) return;
      await saveTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
    });
    if (sessionVersion.current !== version) return;
    setSignOutWarning('');
    updateSession(session);
  }

  const value = { user: currentSession?.user ?? null, acceptSession, signOut, signOutWarning,
    restorationState, retryRestoration, authenticatedFetch: authenticatedFetch.current };
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error('AuthSessionProvider is required.');
  return session;
}
