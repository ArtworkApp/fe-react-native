import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { MobileSession, UserProfile } from '../api/auth';
import { revokeSession } from '../api/logout';
import { clearTokens, saveTokens } from './session-storage';
import { restoreSession } from './restore-session';

type RestorationState = 'loading' | 'retry' | 'ready';

interface AuthSessionContextValue {
  user: UserProfile | null;
  acceptSession: (session: MobileSession) => Promise<void>;
  signOut: () => Promise<void>;
  signOutWarning: string;
  restorationState: RestorationState;
  retryRestoration: () => void;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<MobileSession | null>(null);
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
      setCurrentSession(result.state === 'authenticated' ? result.session : null);
      setRestorationState('ready');
    }).catch(() => {
      if (restoration.current !== pending) return;
      restoration.current = null;
      setRestorationState('retry');
    });
  }, []);

  useEffect(() => { retryRestoration(); }, [retryRestoration]);

  async function signOut(): Promise<void> {
    if (!currentSession) return;
    setCurrentSession(null);
    setSignOutWarning('');
    let storageCleared = true;
    try {
      await clearTokens();
    } catch {
      storageCleared = false;
    }
    try {
      if (!await revokeSession(currentSession.refreshToken)) {
        setSignOutWarning('Could not confirm sign-out with the server.');
      }
    } catch {
      setSignOutWarning('Could not confirm sign-out with the server.');
    }
    if (!storageCleared) setSignOutWarning('Could not remove saved credentials from this device.');
  }

  async function acceptSession(session: MobileSession): Promise<void> {
    await saveTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
    setSignOutWarning('');
    setCurrentSession(session);
  }

  const value = { user: currentSession?.user ?? null, acceptSession, signOut, signOutWarning,
    restorationState, retryRestoration };
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error('AuthSessionProvider is required.');
  return session;
}
