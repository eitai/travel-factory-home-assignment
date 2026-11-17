import { z } from 'zod';
import { vacationRequestEventTypeValues } from '@vacation-manager/shared';
import { publishEvent } from '../../services/eventService';

export const VACATION_REQUEST_CHANGED_EVENT_PATH = 'events/vacation-request-changed';

export const vacationRequestChangedEventSchema = z.object({
  type: z.enum(vacationRequestEventTypeValues),
  vacationRequestId: z.number().int().positive(),
  actorUserId: z.number().int().positive(),
  details: z
    .object({
      startDate: z.iso.date().optional(),
      endDate: z.iso.date().optional(),
      comment: z.string().optional(),
    })
    .nullable(),
});

export type VacationRequestChangedEvent = z.infer<typeof vacationRequestChangedEventSchema>;

export function publishVacationRequestChanged(event: VacationRequestChangedEvent): Promise<void> {
  return publishEvent(VACATION_REQUEST_CHANGED_EVENT_PATH, event);
}
