import { z } from 'zod';
import { countDaysInclusive, isDateRangeOrdered } from '../services/timeService';

export const MAX_TEAM_CALENDAR_DAYS = 62;

export const teamCalendarQuerySchema = z
  .object({
    from: z.iso.date({ error: 'Choose the first day to show' }),
    to: z.iso.date({ error: 'Choose the last day to show' }),
  })
  .refine((query) => isDateRangeOrdered(query.from, query.to), {
    path: ['to'],
    error: 'The last day must be on or after the first day',
  })
  .refine((query) => countDaysInclusive(query.from, query.to) <= MAX_TEAM_CALENDAR_DAYS, {
    path: ['to'],
    error: `The calendar shows at most ${MAX_TEAM_CALENDAR_DAYS} days at a time`,
  });

export type TeamCalendarQuery = z.infer<typeof teamCalendarQuerySchema>;
