export type FieldErrors = Record<string, string>;

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
