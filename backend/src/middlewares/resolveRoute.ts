import type { RequestHandler } from 'express';
import { createCommonEventFromRequest, resolveRoute } from '../services/cefService';
import { notFound } from '../services/errorService';
import { setResolvedRoute } from '../services/requestStateService';

export const resolveRouteMiddleware: RequestHandler = (request, response, next) => {
  const resolvedRoute = resolveRoute(createCommonEventFromRequest(request));
  if (!resolvedRoute || resolvedRoute.access.kind === 'internal') {
    throw notFound('This address does not exist');
  }
  setResolvedRoute(response, resolvedRoute);
  next();
};
