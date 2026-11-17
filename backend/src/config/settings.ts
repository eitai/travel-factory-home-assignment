import { z } from 'zod';

const MINIMUM_SECRET_LENGTH = 32;

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string({ error: 'DATABASE_URL is required' }).min(1),
  JWT_SECRET: z.string({ error: 'JWT_SECRET is required' }).min(MINIMUM_SECRET_LENGTH, {
    error: `JWT_SECRET must be at least ${MINIMUM_SECRET_LENGTH} characters`,
  }),
  JWT_EXPIRES_IN_HOURS: z.coerce.number().positive().default(8),
  FRONT_END_URL: z.string().default('http://localhost:5173'),
  PASSWORD_HASH_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
});

export interface Settings {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresInHours: number;
  frontEndUrl: string;
  passwordHashRounds: number;
}

let cachedSettings: Settings | undefined;

export function getSettings(): Settings {
  if (cachedSettings) {
    return cachedSettings;
  }

  const parsedEnvironment = environmentSchema.safeParse(process.env);
  if (!parsedEnvironment.success) {
    const problems = parsedEnvironment.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid settings. Check backend/.env:\n${problems}`);
  }

  const environment = parsedEnvironment.data;
  cachedSettings = {
    port: environment.PORT,
    databaseUrl: environment.DATABASE_URL,
    jwtSecret: environment.JWT_SECRET,
    jwtExpiresInHours: environment.JWT_EXPIRES_IN_HOURS,
    frontEndUrl: environment.FRONT_END_URL,
    passwordHashRounds: environment.PASSWORD_HASH_ROUNDS,
  };
  return cachedSettings;
}

export function resetSettings(): void {
  cachedSettings = undefined;
}
