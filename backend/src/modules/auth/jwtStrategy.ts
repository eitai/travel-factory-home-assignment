import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { getSettings } from '../../config/settings';
import {
  readUserFromTokenPayload,
  TOKEN_ALGORITHM,
  TOKEN_ISSUER,
} from '../../services/tokenService';

export function createJwtStrategy(): JwtStrategy {
  return new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getSettings().jwtSecret,
      issuer: TOKEN_ISSUER,
      algorithms: [TOKEN_ALGORITHM],
    },
    (tokenPayload: unknown, completeVerification) => {
      completeVerification(null, readUserFromTokenPayload(tokenPayload) ?? false);
    },
  );
}
