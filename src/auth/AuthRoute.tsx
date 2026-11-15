import { useRouter } from 'expo-router';
import { authenticate, type AuthCredentials, type MobileSession } from '../api/auth';
import { AuthForm } from '../components/AuthForm';
import { Pressable, Text } from 'react-native';
import { useAuthSession } from './AuthSessionProvider';
import type { AuthMode } from './form';

export function AuthRoute({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { acceptSession, restorationState, retryRestoration } = useAuthSession();

  function submitCredentials(credentials: AuthCredentials): Promise<MobileSession> {
    return authenticate(mode, credentials);
  }

  async function completeAuthentication(session: MobileSession): Promise<void> {
    await acceptSession(session);
    returnToPreviousScreen();
  }

  function returnToPreviousScreen(): void {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  if (restorationState === 'loading') return <Text>Checking session…</Text>;
  if (restorationState === 'retry') {
    return <Pressable accessibilityRole="button" onPress={retryRestoration}>
      <Text>Retry session</Text>
    </Pressable>;
  }

  return (
    <AuthForm
      mode={mode}
      onSubmit={submitCredentials}
      onAuthenticated={completeAuthentication}
    />
  );
}
