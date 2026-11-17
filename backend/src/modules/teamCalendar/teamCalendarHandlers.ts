import { teamCalendarQuerySchema, type TeamCalendarQuery } from '@vacation-manager/shared';
import { parseQuery } from '../../services/requestParsingService';
import { protectedRoute, type InputParser } from '../../services/routeService';
import { getTeamCalendar } from './teamCalendarService';

export const parseTeamCalendarQuery: InputParser<TeamCalendarQuery> = (commonEvent) =>
  parseQuery(commonEvent, teamCalendarQuerySchema);

export const handleGetTeamCalendar = protectedRoute(
  { action: 'read', subject: 'TeamCalendar' },
  (query: TeamCalendarQuery) => getTeamCalendar(query),
);
