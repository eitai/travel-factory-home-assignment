import {
  countDaysInclusive,
  formatDate,
  formatDayWithWeekday,
  formatMonthName,
  getYear,
  Role,
  VacationRequestEventType,
  VacationRequestStatus,
  type IsoDate,
  type VacationRequestHistoryEntryDto,
} from '@vacation-manager/shared';

const MAX_INITIALS = 2;

export const roleLabels: Record<Role, string> = {
  [Role.Requester]: 'Requester',
  [Role.Validator]: 'Validator',
};

export const statusLabels: Record<VacationRequestStatus, string> = {
  [VacationRequestStatus.Pending]: 'Pending',
  [VacationRequestStatus.Approved]: 'Approved',
  [VacationRequestStatus.Rejected]: 'Rejected',
};

export const statusMarkerClasses: Record<VacationRequestStatus, string> = {
  [VacationRequestStatus.Pending]: 'status-marker-pending',
  [VacationRequestStatus.Approved]: 'status-marker-approved',
  [VacationRequestStatus.Rejected]: 'status-marker-rejected',
};

export const statusBadgeClasses: Record<VacationRequestStatus, string> = {
  [VacationRequestStatus.Pending]: 'bg-pending-soft text-pending-ink',
  [VacationRequestStatus.Approved]: 'bg-approved-soft text-approved-ink',
  [VacationRequestStatus.Rejected]: 'bg-rejected-soft text-rejected-ink',
};

export const vacationBarClasses: Record<VacationRequestStatus, string> = {
  [VacationRequestStatus.Pending]: 'vacation-bar-pending',
  [VacationRequestStatus.Approved]: 'vacation-bar-approved',
  [VacationRequestStatus.Rejected]: '',
};

export function getInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join('');
}

export function formatDayCount(dayCount: number): string {
  return dayCount === 1 ? '1 day' : `${dayCount} days`;
}

export function formatDateRange(startDate: IsoDate, endDate: IsoDate): string {
  if (startDate === endDate) {
    return formatDate(startDate);
  }
  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
}

export function formatDateRangeWithWeekdays(startDate: IsoDate, endDate: IsoDate): string {
  const endYear = getYear(endDate);
  if (startDate === endDate) {
    return `${formatDayWithWeekday(startDate)} ${endYear}`;
  }
  const startYear = getYear(startDate);
  const formattedStart =
    startYear === endYear
      ? formatDayWithWeekday(startDate)
      : `${formatDayWithWeekday(startDate)} ${startYear}`;
  return `${formattedStart} to ${formatDayWithWeekday(endDate)} ${endYear}`;
}

export function formatVacationLength(startDate: IsoDate, endDate: IsoDate): string {
  return formatDayCount(countDaysInclusive(startDate, endDate));
}

export function describeVacationPeriod(startDate: IsoDate, endDate: IsoDate): string {
  const vacationLength = formatVacationLength(startDate, endDate);
  const startMonth = formatMonthName(startDate);
  const endMonth = formatMonthName(endDate);
  return startMonth === endMonth
    ? `${vacationLength} in ${startMonth}`
    : `${vacationLength}, ${startMonth} to ${endMonth}`;
}

export function describeHistoryEntry(historyEntry: VacationRequestHistoryEntryDto): string {
  const { actorName, details, type } = historyEntry;
  const dateRangeText =
    details?.startDate && details.endDate
      ? formatDateRange(details.startDate, details.endDate)
      : '';

  switch (type) {
    case VacationRequestEventType.Submitted:
      return `${actorName} submitted the request for ${dateRangeText}`;
    case VacationRequestEventType.Updated:
      return `${actorName} changed the dates to ${dateRangeText}`;
    case VacationRequestEventType.Approved:
      return `${actorName} approved the request`;
    case VacationRequestEventType.Rejected:
      return `${actorName} rejected the request: ${details?.comment ?? ''}`;
  }
}
