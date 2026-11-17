import { ForbiddenError } from '@casl/ability';
import { QueryFailedError } from 'typeorm';
import { ZodError } from 'zod';
import { toFieldErrors, type ApiErrorBody, type FieldErrors } from '@vacation-manager/shared';

const POSTGRES_EXCLUSION_VIOLATION = '23P01';
const INTERNAL_ERROR_STATUS = 500;

export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function badRequest(message: string, fields?: FieldErrors): AppError {
  return new AppError(400, 'VALIDATION_ERROR', message, fields);
}

export function unauthorized(code = 'UNAUTHENTICATED', message = 'Sign in to continue'): AppError {
  return new AppError(401, code, message);
}

export function forbidden(message = 'You are not allowed to do this'): AppError {
  return new AppError(403, 'FORBIDDEN', message);
}

export function notFound(message = 'This item does not exist'): AppError {
  return new AppError(404, 'NOT_FOUND', message);
}

export function conflict(code: string, message: string, fields?: FieldErrors): AppError {
  return new AppError(409, code, message, fields);
}

export function tooManyRequests(message: string): AppError {
  return new AppError(429, 'TOO_MANY_ATTEMPTS', message);
}

function readPostgresErrorCode(error: QueryFailedError): string | undefined {
  const driverError = error.driverError as { code?: string } | undefined;
  return driverError?.code;
}

export function toAppError(error: unknown): AppError | undefined {
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

export function toErrorResponse(appError: AppError | undefined): {
  statusCode: number;
  body: ApiErrorBody;
} {
  return {
    statusCode: appError?.statusCode ?? INTERNAL_ERROR_STATUS,
    body: {
      error: {
        code: appError?.code ?? 'INTERNAL_ERROR',
        message: appError?.message ?? 'Something went wrong on our side. Try again in a moment.',
        ...(appError?.fields ? { fields: appError.fields } : {}),
      },
    },
  };
}
