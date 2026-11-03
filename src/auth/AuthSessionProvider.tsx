import { createContext, useContext, useState, type ReactNode } from 'react';
import type { MobileSession, UserProfile } from '../api/auth';
import { revokeSession } from '../api/logout';

interface AuthSessionContextValue {
  user: UserProfile | null;
  acceptSession: (session: MobileSession) => void;
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
    try {
      if (!await revokeSession(currentSession.refreshToken)) {
        setSignOutWarning('Could not confirm sign-out with the server.');
      }
    } catch {
      setSignOutWarning('Could not confirm sign-out with the server.');
    }
  }

  function acceptSession(session: MobileSession): void {
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
