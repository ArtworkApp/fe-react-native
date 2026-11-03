import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthSession } from '../auth/AuthSessionProvider';

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut, restorationState, retryRestoration } = useAuthSession();
  if (restorationState === 'loading') return <Text>Checking session…</Text>;
  if (restorationState === 'retry') {
    return <Pressable accessibilityRole="button" onPress={retryRestoration}>
      <Text>Retry session</Text>
    </Pressable>;
  }
  if (!user) return <Redirect href="/login" />;

  function handleSignOut(): void {
    void signOut();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.heading}>Your account</Text>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Sign out"
          onPress={handleSignOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  content: { padding: 24 },
  heading: { color: '#1c1917', fontSize: 28, fontWeight: '700' },
  label: { color: '#57534e', fontSize: 14, marginTop: 24 },
  email: { color: '#1c1917', fontSize: 18, marginTop: 6 },
  signOut: { alignItems: 'center', alignSelf: 'flex-start', borderColor: '#d6d3d1',
    borderRadius: 10, borderWidth: 1, justifyContent: 'center', marginTop: 28,
    minHeight: 44, paddingHorizontal: 20 },
  signOutText: { color: '#1c1917', fontWeight: '600' },
});
