import { existsSync } from 'node:fs';
import path from 'node:path';
import { resetSettings } from '../../src/config/settings';

const environmentFilePath = path.join(import.meta.dirname, '..', '..', '.env');
const DEFAULT_TEST_DATABASE_URL =
  'postgres://vacation:vacation@localhost:5440/vacation_manager_test';

export function prepareTestEnvironment(): void {
  if (existsSync(environmentFilePath)) {
    process.loadEnvFile(environmentFilePath);
  }
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
  process.env.JWT_SECRET ??= 'test-secret-that-is-long-enough-for-the-settings-check';
  process.env.PASSWORD_HASH_ROUNDS = '4';
  resetSettings();
}

prepareTestEnvironment();
