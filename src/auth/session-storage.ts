import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

const tokenKey = 'artworkapp.session.tokens';
const tokenSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  refreshPending: z.boolean().optional(),
});

export type SessionTokens = z.infer<typeof tokenSchema>;

function parseTokens(stored: string): SessionTokens | null {
  try {
    const result = tokenSchema.safeParse(JSON.parse(stored));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(tokenKey);
}

export async function saveTokens(tokens: SessionTokens): Promise<void> {
  try {
    await SecureStore.setItemAsync(tokenKey, JSON.stringify(tokens));
  } catch (error) {
    await clearTokens();
    throw error;
  }
}

export async function markRefreshPending(tokens: SessionTokens): Promise<void> {
  await SecureStore.setItemAsync(tokenKey, JSON.stringify({ ...tokens, refreshPending: true }));
}

export async function loadTokens(): Promise<SessionTokens | null> {
  const stored = await SecureStore.getItemAsync(tokenKey);
  if (stored === null) return null;
  const tokens = parseTokens(stored);
  if (tokens) return tokens;
  await clearTokens();
  return null;
}
