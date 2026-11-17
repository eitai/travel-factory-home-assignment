import axios from 'axios';
import { readStoredToken } from './tokenStorageService';

const DEFAULT_API_URL = 'http://localhost:3000/api/v1';
const REQUEST_TIMEOUT_MILLISECONDS = 15_000;

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? DEFAULT_API_URL,
  timeout: REQUEST_TIMEOUT_MILLISECONDS,
});

let handleExpiredSession: () => void = () => undefined;

export function onSessionExpired(expiredSessionHandler: () => void): void {
  handleExpiredSession = expiredSessionHandler;
}

httpClient.interceptors.request.use((requestConfig) => {
  const token = readStoredToken();
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const wasSignedIn = readStoredToken() !== null;
    if (axios.isAxiosError(error) && error.response?.status === 401 && wasSignedIn) {
      handleExpiredSession();
    }
    return Promise.reject(error);
  },
);
