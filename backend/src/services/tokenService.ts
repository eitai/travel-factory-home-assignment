import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { roleValues, type UserDto } from '@vacation-manager/shared';
import { getSettings } from '../config/settings';

export const TOKEN_ISSUER = 'vacation-manager';
export const TOKEN_ALGORITHM = 'HS256';

const accessTokenPayloadSchema = z.object({
  sub: z.coerce.number().int().positive(),
  name: z.string(),
  email: z.string(),
  role: z.enum(roleValues),
});

export function signAccessToken(user: UserDto): string {
  const settings = getSettings();
  return jwt.sign({ name: user.name, email: user.email, role: user.role }, settings.jwtSecret, {
    algorithm: TOKEN_ALGORITHM,
    issuer: TOKEN_ISSUER,
    subject: String(user.id),
    expiresIn: `${settings.jwtExpiresInHours}h`,
  });
}

export function readUserFromTokenPayload(tokenPayload: unknown): UserDto | undefined {
  const parsedPayload = accessTokenPayloadSchema.safeParse(tokenPayload);
  if (!parsedPayload.success) {
    return undefined;
  }
  const { sub, name, email, role } = parsedPayload.data;
  return { id: sub, name, email, role };
}
