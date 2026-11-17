import { describe, expect, it } from 'vitest';
import { createVacationRequestInputSchema } from './schemas/vacationRequestSchemas';
import { countDaysInclusive, listDatesInRange } from './services/timeService';
import { VacationRequestStatus } from './vacationRequestStatus';
import {
  canVacationRequestBeChanged,
  doDateRangesOverlap,
  isDateInPast,
  isDateRangeOrdered,
} from './vacationRules';

const TODAY = '2026-11-17';

describe('date order', () => {
  it('accepts a one-day vacation', () => {
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
  const december1To5 = { startDate: '2026-12-01', endDate: '2026-12-05' };

  it('detects ranges that share a single day', () => {
    expect(
      doDateRangesOverlap(december1To5, { startDate: '2026-12-05', endDate: '2026-12-09' }),
    ).toBe(true);
  });

  it('allows ranges that touch on consecutive days', () => {
    expect(
      doDateRangesOverlap(december1To5, { startDate: '2026-12-06', endDate: '2026-12-09' }),
    ).toBe(false);
  });
});

describe('status', () => {
  it('lets only pending requests change', () => {
    expect(canVacationRequestBeChanged(VacationRequestStatus.Pending)).toBe(true);
    expect(canVacationRequestBeChanged(VacationRequestStatus.Approved)).toBe(false);
    expect(canVacationRequestBeChanged(VacationRequestStatus.Rejected)).toBe(false);
  });
});

describe('time service', () => {
  it('counts both the first and the last day', () => {
    expect(countDaysInclusive('2026-12-01', '2026-12-05')).toBe(5);
    expect(countDaysInclusive('2026-12-01', '2026-12-01')).toBe(1);
  });

  it('counts across a daylight saving change and a month end', () => {
    expect(countDaysInclusive('2026-03-27', '2026-04-02')).toBe(7);
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

describe('vacation request schema', () => {
  const schema = createVacationRequestInputSchema(TODAY);

  it('accepts a valid request and turns an empty reason into null', () => {
    const result = schema.parse({ startDate: '2026-12-01', endDate: '2026-12-03', reason: '  ' });
    expect(result).toEqual({ startDate: '2026-12-01', endDate: '2026-12-03', reason: null });
  });

  it('reports a past start date on the start date field', () => {
    const result = schema.safeParse({ startDate: '2026-11-01', endDate: '2026-12-03' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['startDate']);
  });

  it('reports a reversed range on the end date field', () => {
    const result = schema.safeParse({ startDate: '2026-12-05', endDate: '2026-12-01' });
    expect(result.error?.issues[0]?.path).toEqual(['endDate']);
  });

  it('rejects a date that does not exist', () => {
    expect(schema.safeParse({ startDate: '2026-02-30', endDate: '2026-03-01' }).success).toBe(
      false,
    );
  });
});
