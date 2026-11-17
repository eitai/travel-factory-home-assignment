import type { Response } from 'express';

const NO_CONTENT_STATUS = 204;
const DEFAULT_CONTENT_TYPE = 'application/json';

export interface StructuredResult {
  statusCode: number;
  body?: string;
  headers?: Record<string, string | number | boolean>;
}

export function isStructuredResult(possibleResult: unknown): possibleResult is StructuredResult {
  return (
    typeof possibleResult === 'object' && possibleResult !== null && 'statusCode' in possibleResult
  );
}

export function sendHandlerResult(response: Response, handlerResult: unknown): void {
  if (!isStructuredResult(handlerResult)) {
    response.status(200).json(handlerResult ?? {});
    return;
  }
  if (handlerResult.statusCode === NO_CONTENT_STATUS) {
    response.status(NO_CONTENT_STATUS).end();
    return;
  }
  const contentType = handlerResult.headers?.['Content-Type'] ?? DEFAULT_CONTENT_TYPE;
  response
    .status(handlerResult.statusCode)
    .type(String(contentType))
    .send(handlerResult.body ?? '');
}
