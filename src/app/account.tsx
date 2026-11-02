import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthSession } from '../auth/AuthSessionProvider';

export default function AccountScreen() {
  const { user } = useAuthSession();
  if (!user) return <Redirect href="/login" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.heading}>Your account</Text>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>{user.email}</Text>
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
});
