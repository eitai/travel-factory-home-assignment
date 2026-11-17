import {
  Role,
  type TeamCalendarMemberDto,
  type TeamCalendarQuery,
  type TeamCalendarVacationDto,
} from '@vacation-manager/shared';
import { findUsersByRole } from '../users/userRepository';
import { findActiveVacationRequestsBetween } from '../vacationRequests/vacationRequestRepository';

export async function getTeamCalendar(query: TeamCalendarQuery): Promise<TeamCalendarMemberDto[]> {
  const [requesters, vacationRequests] = await Promise.all([
    findUsersByRole(Role.Requester),
    findActiveVacationRequestsBetween(query.from, query.to),
  ]);

  const vacationsByUserId = new Map<number, TeamCalendarVacationDto[]>();
  for (const vacationRequest of vacationRequests) {
    const vacationsOfUser = vacationsByUserId.get(vacationRequest.userId) ?? [];
    vacationsOfUser.push({
      vacationRequestId: vacationRequest.id,
      startDate: vacationRequest.startDate,
      endDate: vacationRequest.endDate,
      status: vacationRequest.status,
    });
    vacationsByUserId.set(vacationRequest.userId, vacationsOfUser);
  }

  return requesters.map((requester) => ({
    userId: requester.id,
    userName: requester.name,
    vacations: vacationsByUserId.get(requester.id) ?? [],
  }));
}
