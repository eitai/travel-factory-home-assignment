import { ForbiddenError } from '@casl/ability';
import type { ErrorRequestHandler } from 'express';
import { QueryFailedError } from 'typeorm';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@vacation-manager/shared';
import {
  AppError,
  badRequest,
  conflict,
  forbidden,
  type FieldErrors,
} from '../services/errorService';

const POSTGRES_EXCLUSION_VIOLATION = '23P01';

function toFieldErrors(validationError: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of validationError.issues) {
    const fieldName = issue.path.join('.') || 'form';
    fieldErrors[fieldName] ??= issue.message;
  }
  return fieldErrors;
}

function readPostgresErrorCode(error: QueryFailedError): string | undefined {
  const driverError = error.driverError as { code?: string } | undefined;
  return driverError?.code;
}

function toAppError(error: unknown): AppError | undefined {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof ZodError) {
    return badRequest('Some fields need your attention', toFieldErrors(error));
  }
  if (error instanceof ForbiddenError) {
    return forbidden();
  }
  if (
    error instanceof QueryFailedError &&
    readPostgresErrorCode(error) === POSTGRES_EXCLUSION_VIOLATION
  ) {
    const message = 'These dates overlap another request';
    return conflict('DATES_OVERLAP', message, { startDate: message });
  }
  return undefined;
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const appError = toAppError(error);
  if (!appError) {
    console.error('Unexpected error', error);
  }

  const statusCode = appError?.statusCode ?? 500;
  const errorBody: ApiErrorBody = {
    error: {
      code: appError?.code ?? 'INTERNAL_ERROR',
      message: appError?.message ?? 'Something went wrong on our side. Try again in a moment.',
      ...(appError?.fields ? { fields: appError.fields } : {}),
    },
  };
  response.status(statusCode).json(errorBody);
};
