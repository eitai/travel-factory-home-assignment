import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  countDaysInclusive,
  createIsoDate,
  doDateRangesOverlap,
  firstDayOfMonth,
  formatDayWithWeekday,
  formatLongDate,
  formatMonthName,
  formatMonthShort,
  getDayOfMonth,
  getIsoWeekday,
  getMonthIndex,
  getYear,
  isDateInPast,
  isDateRangeOrdered,
  isWeekend,
  lastDayOfMonth,
  listDatesInRange,
  listMonthNames,
  listWeekdayNames,
} from './timeService';

const TODAY = '2026-11-17';

describe('date order', () => {
  it('accepts a range of one day', () => {
    expect(isDateRangeOrdered('2026-12-01', '2026-12-01')).toBe(true);
  });

  it('rejects an end date before the start date', () => {
    expect(isDateRangeOrdered('2026-12-05', '2026-12-01')).toBe(false);
  });
});

describe('past dates', () => {
  it('treats today as allowed and yesterday as past', () => {
    expect(isDateInPast(TODAY, TODAY)).toBe(false);
    expect(isDateInPast('2026-11-16', TODAY)).toBe(true);
  });
});

describe('overlap', () => {
  const decemberFirstToFifth = { startDate: '2026-12-01', endDate: '2026-12-05' };

  it('detects ranges that share a single day', () => {
    expect(
      doDateRangesOverlap(decemberFirstToFifth, { startDate: '2026-12-05', endDate: '2026-12-09' }),
    ).toBe(true);
  });

  it('allows ranges that touch on consecutive days', () => {
    expect(
      doDateRangesOverlap(decemberFirstToFifth, { startDate: '2026-12-06', endDate: '2026-12-09' }),
    ).toBe(false);
  });
});

describe('day arithmetic', () => {
  it('counts both the first and the last day', () => {
    expect(countDaysInclusive('2026-12-01', '2026-12-05')).toBe(5);
    expect(countDaysInclusive('2026-12-01', '2026-12-01')).toBe(1);
  });

  it('counts across a daylight saving change and a month end', () => {
    expect(countDaysInclusive('2026-03-27', '2026-04-02')).toBe(7);
  });

  it('adds days across a year end', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2027-01-02', -3)).toBe('2026-12-30');
  });

  it('lists every date in a range', () => {
    expect(listDatesInRange('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
  });
});

describe('months and weekdays', () => {
  it('finds the first and last day of a month, including a leap February', () => {
    expect(firstDayOfMonth(2028, 1)).toBe('2028-02-01');
    expect(lastDayOfMonth(2028, 1)).toBe('2028-02-29');
    expect(lastDayOfMonth(2026, 11)).toBe('2026-12-31');
  });

  it('numbers weekdays from Monday as 1 to Sunday as 7', () => {
    expect(getIsoWeekday('2026-11-16')).toBe(1);
    expect(getIsoWeekday('2026-11-22')).toBe(7);
  });
});

describe('formatting', () => {
  it('names the month in full and in short', () => {
    expect(formatMonthName('2026-12-21')).toBe('December');
    expect(formatMonthShort('2026-12-21')).toBe('Dec');
  });

  it('writes a day with its weekday', () => {
    expect(formatDayWithWeekday('2026-12-21')).toBe('Mon 21 Dec');
  });

  it('reads the day, the year and the weekend from a date', () => {
    expect(getDayOfMonth('2026-12-05')).toBe(5);
    expect(getYear('2027-01-01')).toBe(2027);
    expect(isWeekend('2026-12-19')).toBe(true);
    expect(isWeekend('2026-12-21')).toBe(false);
  });
});

describe('month arithmetic', () => {
  it('builds a date from its parts', () => {
    expect(createIsoDate(2027, 0, 5)).toBe('2027-01-05');
    expect(getMonthIndex('2027-01-05')).toBe(0);
  });

  it('moves by whole months across a year end', () => {
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonths('2027-01-15', -1)).toBe('2026-12-15');
    expect(addMonths('2026-11-17', 14)).toBe('2028-01-17');
  });

  it('keeps the day inside a shorter month', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
  });
});

describe('names for calendars', () => {
  it('lists the twelve months in order', () => {
    const monthNames = listMonthNames();

    expect(monthNames).toHaveLength(12);
    expect(monthNames[0]).toBe('January');
    expect(monthNames[11]).toBe('December');
  });

  it('lists the weekdays starting on Monday', () => {
    const weekdayNames = listWeekdayNames();

    expect(weekdayNames).toHaveLength(7);
    expect(weekdayNames[0]).toEqual({ short: 'Mon', long: 'Monday' });
    expect(weekdayNames[6]).toEqual({ short: 'Sun', long: 'Sunday' });
  });

  it('writes a date in full, with its weekday', () => {
    expect(formatLongDate('2026-12-21')).toContain('Monday');
    expect(formatLongDate('2026-12-21')).toContain('21 December 2026');
  });
});
