import type { Response } from 'express';
import type { AppAbility } from '@vacation-manager/shared';
import type { ResolvedRoute } from './cefService';

interface RequestState {
  resolvedRoute?: ResolvedRoute;
  ability?: AppAbility;
}

function getRequestState(response: Response): RequestState {
  return response.locals as RequestState;
}

export function setResolvedRoute(response: Response, resolvedRoute: ResolvedRoute): void {
  getRequestState(response).resolvedRoute = resolvedRoute;
}

export function getResolvedRoute(response: Response): ResolvedRoute {
  const { resolvedRoute } = getRequestState(response);
  if (!resolvedRoute) {
    throw new Error('resolveRoute must run before this middleware');
  }
  return resolvedRoute;
}

export function setAbility(response: Response, ability: AppAbility): void {
  getRequestState(response).ability = ability;
}

export function getAbility(response: Response): AppAbility | undefined {
  return getRequestState(response).ability;
}
