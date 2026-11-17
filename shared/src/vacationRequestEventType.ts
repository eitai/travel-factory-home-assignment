export const VacationRequestEventType = {
  Submitted: 'SUBMITTED',
  Updated: 'UPDATED',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const;

export type VacationRequestEventType =
  (typeof VacationRequestEventType)[keyof typeof VacationRequestEventType];

export const vacationRequestEventTypeValues = Object.values(VacationRequestEventType);
