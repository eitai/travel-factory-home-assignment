import { describe, expect, it } from 'vitest';
import { canVacationRequestBeChanged } from '../services/vacationRuleService';
import { validateWithSchema } from '../services/validationService';
import { VacationRequestStatus } from '../vacationRequestStatus';
import {
  createVacationRequestInputSchema,
  rejectVacationRequestSchema,
} from './vacationRequestSchemas';

const TODAY = '2026-11-17';
const vacationRequestInputSchema = createVacationRequestInputSchema(TODAY);

describe('vacation request input', () => {
  it('accepts a valid request and turns an empty reason into null', () => {
    const parsedInput = vacationRequestInputSchema.parse({
      startDate: '2026-12-01',
      endDate: '2026-12-03',
      reason: '  ',
    });

    expect(parsedInput).toEqual({ startDate: '2026-12-01', endDate: '2026-12-03', reason: null });
  });

  it('reports a past start date on the start date field', () => {
    const validation = validateWithSchema(vacationRequestInputSchema, {
      startDate: '2026-11-01',
      endDate: '2026-12-03',
    });

    expect(validation).toEqual({
      isValid: false,
      fieldErrors: { startDate: 'The start date cannot be in the past' },
    });
  });

  it('reports a reversed range on the end date field', () => {
    const validation = validateWithSchema(vacationRequestInputSchema, {
      startDate: '2026-12-05',
      endDate: '2026-12-01',
    });

    expect(validation.isValid).toBe(false);
    expect(validation.isValid ? {} : validation.fieldErrors).toHaveProperty('endDate');
  });

  it('rejects a date that does not exist', () => {
    const validation = validateWithSchema(vacationRequestInputSchema, {
      startDate: '2026-02-30',
      endDate: '2026-03-01',
    });

    expect(validation.isValid).toBe(false);
  });
});

describe('rejection comment', () => {
  it('requires a comment that is not only spaces', () => {
    expect(validateWithSchema(rejectVacationRequestSchema, { comment: '   ' }).isValid).toBe(false);
    expect(validateWithSchema(rejectVacationRequestSchema, {}).isValid).toBe(false);
  });

  it('trims the comment', () => {
    expect(rejectVacationRequestSchema.parse({ comment: '  Release week  ' })).toEqual({
      comment: 'Release week',
    });
  });
});

describe('request status', () => {
  it('lets only pending requests change', () => {
    expect(canVacationRequestBeChanged(VacationRequestStatus.Pending)).toBe(true);
    expect(canVacationRequestBeChanged(VacationRequestStatus.Approved)).toBe(false);
    expect(canVacationRequestBeChanged(VacationRequestStatus.Rejected)).toBe(false);
  });
});
