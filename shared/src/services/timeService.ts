const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export type IsoDate = string;

function padToTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${padToTwoDigits(date.getMonth() + 1)}-${padToTwoDigits(date.getDate())}`;
}

export function todayIsoDate(now: Date = new Date()): IsoDate {
  return toIsoDate(now);
}

function toUtcDate(isoDate: IsoDate): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function fromUtcDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

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

export function addDays(isoDate: IsoDate, dayCount: number): IsoDate {
  return fromUtcDate(new Date(toUtcDate(isoDate).getTime() + dayCount * MILLISECONDS_PER_DAY));
}

export function countDaysInclusive(startDate: IsoDate, endDate: IsoDate): number {
  const elapsedMilliseconds = toUtcDate(endDate).getTime() - toUtcDate(startDate).getTime();
  return Math.round(elapsedMilliseconds / MILLISECONDS_PER_DAY) + 1;
}

export function firstDayOfMonth(year: number, monthIndex: number): IsoDate {
  return `${year}-${padToTwoDigits(monthIndex + 1)}-01`;
}

export function lastDayOfMonth(year: number, monthIndex: number): IsoDate {
  return fromUtcDate(new Date(Date.UTC(year, monthIndex + 1, 0)));
}

export function listDatesInRange(startDate: IsoDate, endDate: IsoDate): IsoDate[] {
  const dates: IsoDate[] = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

export function getIsoWeekday(isoDate: IsoDate): number {
  return toUtcDate(isoDate).getUTCDay() || 7;
}

export function formatDate(isoDate: IsoDate, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toUtcDate(isoDate));
}

export function formatMonth(year: number, monthIndex: number, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

export function formatDateTime(isoTimestamp: string, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoTimestamp));
}

export function formatWeekday(isoDate: IsoDate, locale = 'en-GB'): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(
    toUtcDate(isoDate),
  );
}

export function getDayOfMonth(isoDate: IsoDate): number {
  return toUtcDate(isoDate).getUTCDate();
}

export function isWeekend(isoDate: IsoDate): boolean {
  return getIsoWeekday(isoDate) >= 6;
}
