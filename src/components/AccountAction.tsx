import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAuthSession } from '../auth/AuthSessionProvider';

export function AccountAction() {
  const router = useRouter();
  const { user, restorationState, retryRestoration } = useAuthSession();
  if (restorationState === 'loading') return <Text style={styles.text}>Checking…</Text>;
  if (restorationState === 'retry') {
    return <Pressable accessibilityRole="button" onPress={retryRestoration} style={styles.button}>
      <Text style={styles.text}>Retry session</Text>
    </Pressable>;
  }
  const label = user ? 'Profile' : 'Sign in';

  function openAccount(): void {
    router.push(user ? '/account' : '/login');
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      style={styles.button} onPress={openAccount}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', minHeight: 44,
    paddingHorizontal: 10 },
  text: { color: '#1c1917', fontSize: 14, fontWeight: '600' },
});
