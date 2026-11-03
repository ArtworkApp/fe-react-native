import { Stack } from 'expo-router';
import { AuthSessionProvider } from '../auth/AuthSessionProvider';

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="artworks" options={{ title: 'Artworks' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ title: 'Your account' }} />
      </Stack>
    </AuthSessionProvider>
  );
}
