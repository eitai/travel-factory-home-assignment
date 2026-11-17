import type { RequestHandler } from 'express';
import { getAbility, getResolvedRoute } from '../services/requestStateService';
import { isStructuredResult, sendHandlerResult } from '../services/responseService';
import type { AnonymousContext, RequestContext } from '../services/routeService';

export const dispatch: RequestHandler = async (request, response) => {
  const { commonEvent, inputParser, routeHandler } = getResolvedRoute(response);
  const ability = getAbility(response);

  const input = inputParser ? inputParser(commonEvent) : {};
  if (isStructuredResult(input)) {
    sendHandlerResult(response, input);
    return;
  }

  const context: RequestContext | AnonymousContext =
    request.user && ability ? { commonEvent, currentUser: request.user, ability } : { commonEvent };

  sendHandlerResult(response, await routeHandler(input, context));
};
