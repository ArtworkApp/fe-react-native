import { Stack } from 'expo-router';
import { AuthSessionProvider } from '../auth/AuthSessionProvider';
import { AccountAction } from '../components/AccountAction';

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="artworks" options={{ title: 'Artworks', headerRight: () => <AccountAction /> }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ title: 'Your account' }} />
      </Stack>
    </AuthSessionProvider>
  );
}
