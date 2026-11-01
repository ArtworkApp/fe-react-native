import { parseAuthenticationResponse } from './auth-contract';
import type { AuthCredentials, AuthOperation, MobileSession } from './auth-contract';
import { sendAuthenticationRequest } from './auth-transport';

export { AuthApiError } from './auth-contract';
export type { AuthCredentials, MobileSession, UserProfile } from './auth-contract';

export async function authenticate(
  operation: AuthOperation,
  credentials: AuthCredentials,
): Promise<MobileSession> {
  const response = await sendAuthenticationRequest(operation, credentials);
  return parseAuthenticationResponse(response);
}
