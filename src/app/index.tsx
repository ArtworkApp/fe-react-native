import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthSession } from '../auth/AuthSessionProvider';
import { AccountAction } from '../components/AccountAction';

export default function HomeScreen() {
  const router = useRouter();
  const { signOutWarning } = useAuthSession();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.brand}>ArtworkApp</Text>
        <AccountAction />
      </View>
      <View style={styles.content}>
        {signOutWarning ? <Text accessibilityRole="alert">{signOutWarning}</Text> : null}
        <Text style={styles.heading}>Welcome to ArtworkApp</Text>
        <Text style={styles.description}>Explore original artworks.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Browse Art"
          style={styles.button} onPress={() => router.push('/artworks')}>
          <Text style={styles.buttonText}>Browse Art</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9' },
  header: { alignItems: 'center', borderBottomColor: '#e7e5e4', borderBottomWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20,
    paddingVertical: 8 },
  content: { paddingHorizontal: 24, paddingTop: 28 },
  brand: { color: '#57534e', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  heading: { color: '#1c1917', fontSize: 28, fontWeight: '700', marginTop: 28 },
  description: { color: '#57534e', fontSize: 15, marginTop: 8 },
  button: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#1c1917',
    borderRadius: 10, justifyContent: 'center', minHeight: 44, marginTop: 24,
    paddingHorizontal: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
