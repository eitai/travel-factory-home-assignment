import {
  countDaysInclusive,
  formatDate,
  Role,
  VacationRequestEventType,
  VacationRequestStatus,
  type IsoDate,
  type VacationRequestHistoryEntryDto,
} from '@vacation-manager/shared';

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

export function formatDayCount(dayCount: number): string {
  return dayCount === 1 ? '1 day' : `${dayCount} days`;
}

export function formatDateRange(startDate: IsoDate, endDate: IsoDate): string {
  if (startDate === endDate) {
    return formatDate(startDate);
  }
  return `${formatDate(startDate)} to ${formatDate(endDate)}`;
}

export function formatVacationLength(startDate: IsoDate, endDate: IsoDate): string {
  return formatDayCount(countDaysInclusive(startDate, endDate));
}

export function describeHistoryEntry(historyEntry: VacationRequestHistoryEntryDto): string {
  const { actorName, details, type } = historyEntry;
  const dates =
    details?.startDate && details.endDate
      ? formatDateRange(details.startDate, details.endDate)
      : '';

  switch (type) {
    case VacationRequestEventType.Submitted:
      return `${actorName} submitted the request for ${dates}`;
    case VacationRequestEventType.Updated:
      return `${actorName} changed the dates to ${dates}`;
    case VacationRequestEventType.Approved:
      return `${actorName} approved the request`;
    case VacationRequestEventType.Rejected:
      return `${actorName} rejected the request: ${details?.comment ?? ''}`;
  }
}
