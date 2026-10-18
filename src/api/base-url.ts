export function apiUrl(): URL {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!configuredUrl) {
    throw new Error('Set EXPO_PUBLIC_API_URL to an address reachable from this device.');
  }
  return new URL(configuredUrl.endsWith('/') ? configuredUrl : `${configuredUrl}/`);
}
