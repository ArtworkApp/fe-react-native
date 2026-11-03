import { createContext, useContext, useState, type ReactNode } from 'react';
import type { MobileSession, UserProfile } from '../api/auth';
import { revokeSession } from '../api/logout';
import { clearTokens, saveTokens } from './session-storage';

interface AuthSessionContextValue {
  user: UserProfile | null;
  acceptSession: (session: MobileSession) => Promise<void>;
  signOut: () => Promise<void>;
  signOutWarning: string;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<MobileSession | null>(null);
  const [signOutWarning, setSignOutWarning] = useState('');

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

  const value = { user: currentSession?.user ?? null, acceptSession, signOut, signOutWarning };
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error('AuthSessionProvider is required.');
  return session;
}
