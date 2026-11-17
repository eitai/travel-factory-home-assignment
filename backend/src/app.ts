import cors from 'cors';
import express, { type Express, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { Passport } from 'passport';
import './generated/HandlerRegistry';
import { getSettings } from './config/settings';
import { getDataSource } from './database/dataSource';
import { createAuthenticateMiddleware } from './middlewares/authenticate';
import { authorize } from './middlewares/authorize';
import { dispatch } from './middlewares/dispatch';
import { errorHandler } from './middlewares/errorHandler';
import { resolveRouteMiddleware } from './middlewares/resolveRoute';
import { createJwtStrategy } from './modules/auth/jwtStrategy';
import { AppError, notFound } from './services/errorService';

export const API_PREFIX = '/api/v1';

const LOGIN_ATTEMPT_WINDOW_MINUTES = 15;
const MAX_FAILED_LOGINS_PER_WINDOW = 10;
const MAX_REQUEST_BODY_SIZE = '100kb';

function createLoginRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: LOGIN_ATTEMPT_WINDOW_MINUTES * 60 * 1000,
    limit: MAX_FAILED_LOGINS_PER_WINDOW,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(
        new AppError(
          429,
          'TOO_MANY_ATTEMPTS',
          `Too many failed sign-in attempts. Try again in ${LOGIN_ATTEMPT_WINDOW_MINUTES} minutes.`,
        ),
      );
    },
  });
}

const reportHealth: RequestHandler = async (_request, response) => {
  try {
    await getDataSource().query('SELECT 1');
    response.json({ status: 'ok' });
  } catch {
    response.status(503).json({ status: 'unavailable' });
  }
};

const allowApiDocsViewer: RequestHandler = (_request, response, next) => {
  response.removeHeader('Content-Security-Policy');
  next();
};

export function createApp(): Express {
  const settings = getSettings();
  const passport = new Passport();
  passport.use(createJwtStrategy());

  const app = express();
  app.use(helmet());
  app.use(cors({ origin: settings.frontEndUrl }));
  app.use(express.text({ type: 'application/json', limit: MAX_REQUEST_BODY_SIZE }));

  app.get('/health', reportHealth);
  app.post(`${API_PREFIX}/auth/login`, createLoginRateLimiter());
  app.get(`${API_PREFIX}/doc`, allowApiDocsViewer);

  app.use(
    API_PREFIX,
    resolveRouteMiddleware,
    createAuthenticateMiddleware(passport),
    authorize,
    dispatch,
  );

  app.use(() => {
    throw notFound('This address does not exist');
  });
  app.use(errorHandler);
  return app;
}
