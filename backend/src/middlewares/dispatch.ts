import type { RequestHandler, Response } from 'express';
import type { AnonymousContext, RequestContext } from '../services/routeService';
import { getAbility, getResolvedRoute } from './requestState';

interface StructuredResult {
  statusCode: number;
  body?: string;
  headers?: Record<string, string | number | boolean>;
}

function isStructuredResult(result: unknown): result is StructuredResult {
  return typeof result === 'object' && result !== null && 'statusCode' in result;
}

function sendResult(response: Response, result: unknown): void {
  if (!isStructuredResult(result)) {
    response.status(200).json(result ?? {});
    return;
  }
  if (result.statusCode === 204) {
    response.status(204).end();
    return;
  }
  const contentType = result.headers?.['Content-Type'] ?? 'application/json';
  response
    .status(result.statusCode)
    .type(String(contentType))
    .send(result.body ?? '');
}

export const dispatch: RequestHandler = async (request, response) => {
  const { commonEvent, inputParser, routeHandler } = getResolvedRoute(response);
  const ability = getAbility(response);

  const input = inputParser ? inputParser(commonEvent) : {};
  if (isStructuredResult(input)) {
    sendResult(response, input);
    return;
  }

  const context: RequestContext | AnonymousContext =
    request.user && ability
      ? { event: commonEvent, currentUser: request.user, ability }
      : { event: commonEvent };

  sendResult(response, await routeHandler(input, context));
};
