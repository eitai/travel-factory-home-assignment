import { Client } from 'pg';
import { getSettings } from '../../src/config/settings';
import { closeDataSource, initializeDataSource } from '../../src/database/dataSource';
import { prepareTestEnvironment } from './testEnvironment';

async function createTestDatabaseIfMissing(testDatabaseUrl: string): Promise<void> {
  const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
  const maintenanceUrl = new URL(testDatabaseUrl);
  maintenanceUrl.pathname = '/postgres';

  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();
  const existingDatabase = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    databaseName,
  ]);
  if (existingDatabase.rowCount === 0) {
    await client.query(`CREATE DATABASE "${databaseName}"`);
  }
  await client.end();
}

export async function setup(): Promise<void> {
  prepareTestEnvironment();
  await createTestDatabaseIfMissing(getSettings().databaseUrl);

  const dataSource = await initializeDataSource();
  await dataSource.runMigrations();
  await closeDataSource();
}
