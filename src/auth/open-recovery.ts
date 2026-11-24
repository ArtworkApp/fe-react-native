import * as Linking from 'expo-linking';

export async function openRecoveryPage(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
