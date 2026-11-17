import type { TeamCalendarMemberDto } from '@vacation-manager/shared';
import { httpClient } from './httpClient';

export interface TeamCalendarPeriod {
  from: string;
  to: string;
}

export async function fetchTeamCalendar(
  period: TeamCalendarPeriod,
): Promise<TeamCalendarMemberDto[]> {
  const response = await httpClient.get<TeamCalendarMemberDto[]>('/team-calendar', {
    params: period,
  });
  return response.data;
}
