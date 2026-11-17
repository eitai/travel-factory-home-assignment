import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { Passport } from 'passport';
import './generated/HandlerRegistry';
import { getSettings } from './config/settings';
import { allowApiDocsViewer } from './middlewares/apiDocsViewer';
import { createAuthenticateMiddleware } from './middlewares/authenticate';
import { authorize } from './middlewares/authorize';
import { dispatch } from './middlewares/dispatch';
import { errorHandler } from './middlewares/errorHandler';
import { healthCheck } from './middlewares/healthCheck';
import { createLoginRateLimiter } from './middlewares/loginRateLimiter';
import { resolveRouteMiddleware } from './middlewares/resolveRoute';
import { rejectUnknownAddress } from './middlewares/unknownAddress';
import { createJwtStrategy } from './modules/auth/jwtStrategy';

export const API_PREFIX = '/api/v1';

const MAX_REQUEST_BODY_SIZE = '100kb';

export function createApp(): Express {
  const settings = getSettings();
  const passport = new Passport();
  passport.use(createJwtStrategy());

  const app = express();
  app.use(helmet());
  app.use(cors({ origin: settings.frontEndUrl }));
  app.use(express.text({ type: 'application/json', limit: MAX_REQUEST_BODY_SIZE }));

  app.get('/health', healthCheck);
  app.post(`${API_PREFIX}/auth/login`, createLoginRateLimiter());
  app.get(`${API_PREFIX}/doc`, allowApiDocsViewer);

  app.use(
    API_PREFIX,
    resolveRouteMiddleware,
    createAuthenticateMiddleware(passport),
    authorize,
    dispatch,
  );

  app.use(rejectUnknownAddress);
  app.use(errorHandler);
  return app;
}
