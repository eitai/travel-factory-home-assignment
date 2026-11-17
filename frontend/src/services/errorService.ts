import axios from 'axios';
import type { ApiErrorBody, FieldErrors } from '@vacation-manager/shared';

export interface ReadableError {
  message: string;
  fields: FieldErrors;
  statusCode?: number;
}

const SERVER_UNREACHABLE_MESSAGE =
  'The server cannot be reached. Check your connection and try again.';
const UNEXPECTED_ERROR_MESSAGE = 'Something went wrong. Try again in a moment.';

export function readApiError(error: unknown): ReadableError {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return { message: UNEXPECTED_ERROR_MESSAGE, fields: {} };
  }
  if (!error.response) {
    return { message: SERVER_UNREACHABLE_MESSAGE, fields: {} };
  }

  const apiError = error.response.data?.error;
  return {
    message: apiError?.message ?? UNEXPECTED_ERROR_MESSAGE,
    fields: apiError?.fields ?? {},
    statusCode: error.response.status,
  };
}
