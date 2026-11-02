import { useRouter } from 'expo-router';
import { authenticate, type AuthCredentials, type MobileSession } from '../api/auth';
import { AuthForm } from '../components/AuthForm';
import { useAuthSession } from './AuthSessionProvider';
import type { AuthMode } from './form';

export function AuthRoute({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { acceptSession } = useAuthSession();

  function submitCredentials(credentials: AuthCredentials): Promise<MobileSession> {
    return authenticate(mode, credentials);
  }

  function completeAuthentication(session: MobileSession): void {
    acceptSession(session);
    router.replace('/account');
  }

  return (
    <AuthForm
      mode={mode}
      onSubmit={submitCredentials}
      onAuthenticated={completeAuthentication}
    />
  );
}
