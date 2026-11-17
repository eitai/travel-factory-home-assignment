import bcrypt from 'bcryptjs';
import { getSettings } from '../config/settings';

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, getSettings().passwordHashRounds);
}

export function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
