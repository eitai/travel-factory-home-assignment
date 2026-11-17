import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { tooManyRequests } from '../services/errorService';

const LOGIN_ATTEMPT_WINDOW_MINUTES = 15;
const MAX_FAILED_LOGINS_PER_WINDOW = 10;

export function createLoginRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: LOGIN_ATTEMPT_WINDOW_MINUTES * 60 * 1000,
    limit: MAX_FAILED_LOGINS_PER_WINDOW,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(
        tooManyRequests(
          `Too many failed sign-in attempts. Try again in ${LOGIN_ATTEMPT_WINDOW_MINUTES} minutes.`,
        ),
      );
    },
  });
}
