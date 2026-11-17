import { z } from 'zod';

import { isDateInPast, isDateRangeOrdered, type IsoDate } from '../services/timeService';
import { vacationRequestStatusValues } from '../vacationRequestStatus';
import { paginationQuerySchema } from './paginationSchemas';

export const MAX_REASON_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 500;

export function createVacationRequestInputSchema(today: IsoDate) {
  return z
    .object({
      startDate: z.iso.date({ error: 'Choose a start date' }),
      endDate: z.iso.date({ error: 'Choose an end date' }),
      reason: z
        .string()
        .trim()
        .max(MAX_REASON_LENGTH, { error: `Keep the reason under ${MAX_REASON_LENGTH} characters` })
        .nullish()
        .transform((reason) => reason || null),
    })
    .refine((input) => !isDateInPast(input.startDate, today), {
      path: ['startDate'],
      error: 'The start date cannot be in the past',
    })
    .refine((input) => isDateRangeOrdered(input.startDate, input.endDate), {
      path: ['endDate'],
      error: 'The end date must be on or after the start date',
    });
}

export type VacationRequestInput = z.infer<ReturnType<typeof createVacationRequestInputSchema>>;

export const rejectVacationRequestSchema = z.object({
  comment: z
    .string({ error: 'Explain why the request is rejected' })
    .trim()
    .min(1, { error: 'Explain why the request is rejected' })
    .max(MAX_COMMENT_LENGTH, { error: `Keep the comment under ${MAX_COMMENT_LENGTH} characters` }),
});

export type RejectVacationRequestInput = z.infer<typeof rejectVacationRequestSchema>;

const statusFilterSchema = z.enum(vacationRequestStatusValues).optional();

export const myVacationRequestsQuerySchema = paginationQuerySchema.extend({
  status: statusFilterSchema,
});

export type MyVacationRequestsQuery = z.infer<typeof myVacationRequestsQuerySchema>;

export const allVacationRequestsQuerySchema = paginationQuerySchema.extend({
  status: statusFilterSchema,
  userId: z.coerce.number().int().positive().optional(),
});

export type AllVacationRequestsQuery = z.infer<typeof allVacationRequestsQuerySchema>;
