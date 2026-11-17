import type { Response } from 'express';
import type { AppAbility } from '@vacation-manager/shared';
import type { ResolvedRoute } from '../services/cefService';

interface RequestState {
  route?: ResolvedRoute;
  ability?: AppAbility;
}

function getState(response: Response): RequestState {
  return response.locals as RequestState;
}

export function setResolvedRoute(response: Response, route: ResolvedRoute): void {
  getState(response).route = route;
}

export function getResolvedRoute(response: Response): ResolvedRoute {
  const { route } = getState(response);
  if (!route) {
    throw new Error('resolveRoute must run before this middleware');
  }
  return route;
}

export function setAbility(response: Response, ability: AppAbility): void {
  getState(response).ability = ability;
}

export function getAbility(response: Response): AppAbility | undefined {
  return getState(response).ability;
}
