import type { RequestHandler } from 'express';
import type { Passport } from 'passport';
import type { UserDto } from '@vacation-manager/shared';
import { unauthorized } from '../services/errorService';
import { getResolvedRoute } from './requestState';

export function createAuthenticateMiddleware(
  passport: InstanceType<typeof Passport>,
): RequestHandler {
  return (request, response, next) => {
    if (getResolvedRoute(response).access.kind === 'public') {
      next();
      return;
    }

    const verifyToken = passport.authenticate(
      'jwt',
      { session: false },
      (error: unknown, user: UserDto | false) => {
        if (error) {
          next(error);
          return;
        }
        if (!user) {
          next(unauthorized());
          return;
        }
        request.user = user;
        next();
      },
    ) as RequestHandler;

    verifyToken(request, response, next);
  };
}
