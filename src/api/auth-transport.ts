import { apiUrl } from './base-url';
import type { AuthCredentials, AuthHttpResponse, AuthOperation } from './auth-contract';

interface AuthenticationRequest {
  url: string;
  options: RequestInit;
}

function buildAuthenticationRequest(
  operation: AuthOperation,
  credentials: AuthCredentials,
): AuthenticationRequest {
  return {
    url: new URL(`auth/${operation}`, apiUrl()).toString(),
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        client: 'mobile',
      }),
    },
  };
}

function fetchAuthenticationRequest(request: AuthenticationRequest): Promise<Response> {
  return fetch(request.url, request.options);
}

async function readHttpResponse(response: Response): Promise<AuthHttpResponse> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { ok: response.ok, status: response.status, body };
}

export async function sendAuthenticationRequest(
  operation: AuthOperation,
  credentials: AuthCredentials,
): Promise<AuthHttpResponse> {
  const request = buildAuthenticationRequest(operation, credentials);
  const response = await fetchAuthenticationRequest(request);
  return readHttpResponse(response);
}
