import { clearStoredToken } from './tokenStorageService';

const SIGN_IN_PATH = '/login';

export type SessionEndReason = 'expired';

export function endSession(reason?: SessionEndReason): void {
  clearStoredToken();
  window.location.assign(reason ? `${SIGN_IN_PATH}?reason=${reason}` : SIGN_IN_PATH);
}

export function isSafeRedirectPath(path: string | undefined): path is string {
  return path !== undefined && path.startsWith('/') && !path.startsWith('//');
}
