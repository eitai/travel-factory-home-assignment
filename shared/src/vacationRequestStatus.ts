export const VacationRequestStatus = {
  Pending: 'PENDING',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const;

export type VacationRequestStatus =
  (typeof VacationRequestStatus)[keyof typeof VacationRequestStatus];

export const vacationRequestStatusValues = Object.values(VacationRequestStatus);
