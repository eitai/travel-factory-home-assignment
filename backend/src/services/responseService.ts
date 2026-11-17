import type { Response } from 'express';

const NO_CONTENT_STATUS = 204;
const DEFAULT_CONTENT_TYPE = 'application/json';

export interface StructuredResult {
  statusCode: number;
  body?: string;
  headers?: Record<string, string | number | boolean>;
}

export function isStructuredResult(result: unknown): result is StructuredResult {
  return typeof result === 'object' && result !== null && 'statusCode' in result;
}

export function sendHandlerResult(response: Response, result: unknown): void {
  if (!isStructuredResult(result)) {
    response.status(200).json(result ?? {});
    return;
  }
  if (result.statusCode === NO_CONTENT_STATUS) {
    response.status(NO_CONTENT_STATUS).end();
    return;
  }
  const contentType = result.headers?.['Content-Type'] ?? DEFAULT_CONTENT_TYPE;
  response
    .status(result.statusCode)
    .type(String(contentType))
    .send(result.body ?? '');
}
