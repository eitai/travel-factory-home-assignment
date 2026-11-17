import path from 'node:path';
import type { Request } from 'express';
import { buildCommonEvent, getRouteConfig, resolveHandlerRef } from 'commoneventframework';
import type { CommonEvent, LambdaEvent } from 'commoneventframework/dist/types/commonEvent';
import {
  readRouteAccess,
  type InputParser,
  type RouteAccess,
  type RouteHandler,
} from './routeService';

const ROUTES_FILE_PATH = path.join(__dirname, '..', 'root.yaml');
const API_DOCS_HANDLER_PREFIX = '__builtin__/doc';

let areRoutesLoaded = false;

export interface ResolvedRoute {
  commonEvent: CommonEvent;
  access: RouteAccess;
  routeHandler: RouteHandler;
  inputParser?: InputParser;
}

function flattenQuery(query: Request['query']): Record<string, string> {
  const flatQuery: Record<string, string> = {};
  for (const [parameterName, parameterValue] of Object.entries(query)) {
    if (typeof parameterValue === 'string') {
      flatQuery[parameterName] = parameterValue;
    }
  }
  return flatQuery;
}

export function createCommonEventFromRequest(request: Request): CommonEvent {
  return {
    path: request.path,
    method: request.method,
    body: typeof request.body === 'string' ? request.body : null,
    pathParameters: {},
    queryStringParameters: flattenQuery(request.query),
    headers: request.headers as CommonEvent['headers'],
    version: 'commonEvent',
  };
}

export function resolveRoute(incomingEvent: LambdaEvent): ResolvedRoute | undefined {
  const commonEvent = areRoutesLoaded
    ? buildCommonEvent(incomingEvent)
    : buildCommonEvent(incomingEvent, ROUTES_FILE_PATH);
  areRoutesLoaded = true;

  const routeConfig = getRouteConfig(commonEvent);
  if (!routeConfig?.handler) {
    return undefined;
  }

  const routeHandler = resolveHandlerRef(routeConfig.handler);
  const isApiDocsRoute = routeConfig.handler.startsWith(API_DOCS_HANDLER_PREFIX);
  const access = readRouteAccess(routeHandler) ?? (isApiDocsRoute ? { kind: 'public' } : undefined);
  if (!routeHandler || !access) {
    return undefined;
  }

  const inputParser = routeConfig.inputParser
    ? (resolveHandlerRef(routeConfig.inputParser) as InputParser | undefined)
    : undefined;

  return { commonEvent, access, routeHandler: routeHandler as RouteHandler, inputParser };
}
