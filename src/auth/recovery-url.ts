function isAllowedProtocol(url: URL, isDevelopment: boolean): boolean {
  return url.protocol === 'https:' || (isDevelopment && url.protocol === 'http:');
}

function isOriginOnly(url: URL): boolean {
  return !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash;
}

export function recoveryUrl(origin: string | undefined, isDevelopment: boolean): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (!isAllowedProtocol(url, isDevelopment) || !isOriginOnly(url)) return null;
    return new URL('/forgot-password', url).toString();
  } catch {
    return null;
  }
}
