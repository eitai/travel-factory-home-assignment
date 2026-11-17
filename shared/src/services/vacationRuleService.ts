import { VacationRequestStatus } from '../vacationRequestStatus';

export function canVacationRequestBeChanged(status: VacationRequestStatus): boolean {
  return status === VacationRequestStatus.Pending;
}
