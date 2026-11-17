import type { LoginInput, LoginResponseDto, UserDto } from '@vacation-manager/shared';
import { httpClient } from './httpClient';

export async function login(credentials: LoginInput): Promise<LoginResponseDto> {
  const response = await httpClient.post<LoginResponseDto>('/auth/login', credentials);
  return response.data;
}

export async function fetchCurrentUser(): Promise<UserDto> {
  const response = await httpClient.get<UserDto>('/auth/me');
  return response.data;
}
