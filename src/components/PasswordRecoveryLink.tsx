import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { openRecoveryPage } from '../auth/open-recovery';
import { recoveryUrl } from '../auth/recovery-url';

export function PasswordRecoveryLink() {
  const [openFailed, setOpenFailed] = useState(false);
  const url = recoveryUrl(process.env.EXPO_PUBLIC_WEB_ORIGIN, __DEV__);
  const isUnavailable = url === null;

  async function openPage(): Promise<void> {
    if (!url) return;
    setOpenFailed(false);
    const opened = await openRecoveryPage(url);
    setOpenFailed(!opened);
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Forgot password?"
        accessibilityState={{ disabled: isUnavailable }}
        disabled={isUnavailable}
        onPress={() => { void openPage(); }}
        style={[styles.button, isUnavailable && styles.disabled]}
      >
        <Text style={styles.text}>Forgot password?</Text>
      </Pressable>
      {isUnavailable ? <Text accessibilityRole="alert" style={styles.error}>Password recovery is unavailable. Please try again later.</Text> : null}
      {openFailed ? <Text accessibilityRole="alert" style={styles.error}>Could not open the browser. Please try again.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'flex-end', justifyContent: 'center', minHeight: 44 },
  text: { color: '#44403c', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  disabled: { opacity: 0.55 },
  error: { color: '#b91c1c', fontSize: 14 },
});
