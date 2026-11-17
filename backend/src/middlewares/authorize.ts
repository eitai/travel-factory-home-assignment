import type { RequestHandler } from 'express';
import { defineAbilityFor } from '@vacation-manager/shared';
import { forbidden } from '../services/errorService';
import { getResolvedRoute, setAbility } from './requestState';

export const authorize: RequestHandler = (request, response, next) => {
  const { access } = getResolvedRoute(response);
  if (!request.user) {
    next();
    return;
  }

  const ability = defineAbilityFor(request.user);
  setAbility(response, ability);

  if (
    access.kind === 'permission' &&
    ability.cannot(access.permission.action, access.permission.subject)
  ) {
    throw forbidden();
  }
  next();
};
