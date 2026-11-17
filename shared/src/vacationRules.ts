import type { IsoDate } from './services/timeService';
import { VacationRequestStatus } from './vacationRequestStatus';

export interface DateRange {
  startDate: IsoDate;
  endDate: IsoDate;
}

export function isDateRangeOrdered(startDate: IsoDate, endDate: IsoDate): boolean {
  return endDate >= startDate;
}

export function isDateInPast(date: IsoDate, today: IsoDate): boolean {
  return date < today;
}

export function doDateRangesOverlap(firstRange: DateRange, secondRange: DateRange): boolean {
  return firstRange.startDate <= secondRange.endDate && secondRange.startDate <= firstRange.endDate;
}

export function canVacationRequestBeChanged(status: VacationRequestStatus): boolean {
  return status === VacationRequestStatus.Pending;
}

export function doesStatusBlockDates(status: VacationRequestStatus): boolean {
  return status !== VacationRequestStatus.Rejected;
}
