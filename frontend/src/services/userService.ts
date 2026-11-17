import type { UserSummaryDto } from '@vacation-manager/shared';
import { httpClient } from './httpClient';

export async function fetchRequesters(): Promise<UserSummaryDto[]> {
  const response = await httpClient.get<UserSummaryDto[]>('/users');
  return response.data;
}
