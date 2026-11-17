import type { ErrorRequestHandler } from 'express';
import { toAppError, toErrorResponse } from '../services/errorService';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const appError = toAppError(error);
  if (!appError) {
    console.error('Unexpected error', error);
  }

  const { statusCode, body } = toErrorResponse(appError);
  response.status(statusCode).json(body);
};
