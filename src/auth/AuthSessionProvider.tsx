import { createContext, useContext, useState, type ReactNode } from 'react';
import type { MobileSession, UserProfile } from '../api/auth';

interface AuthSessionContextValue {
  user: UserProfile | null;
  acceptSession: (session: MobileSession) => void;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<MobileSession | null>(null);
  const value = { user: currentSession?.user ?? null, acceptSession: setCurrentSession };
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error('AuthSessionProvider is required.');
  return session;
}
