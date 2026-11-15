import { apiUrl } from './base-url';
import type { SessionTokens } from '../auth/session-storage';

interface AuthenticatedFetchOptions {
  getTokens: () => SessionTokens | null;
  refresh: () => Promise<SessionTokens | null>;
  invalidate: () => void | Promise<void>;
}

function resolvePrivateUrl(path: string): string {
  const base = apiUrl();
  const url = new URL(path, base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new Error('Authenticated requests must use the API base URL.');
  }
  const relativePath = decodeURIComponent(url.pathname.slice(base.pathname.length));
  if (relativePath === 'auth' || relativePath.startsWith('auth/')) {
    throw new Error('Authentication endpoints cannot use authenticated requests.');
  }
  return url.toString();
}

function sendRequest(url: string, options: RequestInit, accessToken: string): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(url, { ...options, headers });
}

export function createAuthenticatedFetch(options: AuthenticatedFetchOptions) {
  let pendingRefresh: Promise<SessionTokens | null> | null = null;

  function refreshOnce(): Promise<SessionTokens | null> {
    if (!pendingRefresh) {
      pendingRefresh = options.refresh().finally(() => { pendingRefresh = null; });
    }
    return pendingRefresh;
  }

  async function getRetryTokens(original: SessionTokens): Promise<SessionTokens | null> {
    const current = options.getTokens();
    if (!current) return null;
    if (current.accessToken !== original.accessToken) return current;
    return refreshOnce();
  }

  return async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const url = resolvePrivateUrl(path);
    const original = options.getTokens();
    if (!original) throw new Error('Authentication is required.');
    const response = await sendRequest(url, init, original.accessToken);
    if (response.status !== 401) return response;

    const retryTokens = await getRetryTokens(original);
    if (!retryTokens || options.getTokens()?.accessToken !== retryTokens.accessToken) return response;
    const retryResponse = await sendRequest(url, init, retryTokens.accessToken);
    if (retryResponse.status === 401 && options.getTokens()?.accessToken === retryTokens.accessToken) {
      await options.invalidate();
    }
    return retryResponse;
  };
}
