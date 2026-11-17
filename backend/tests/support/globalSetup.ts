import { Client } from 'pg';
import { getSettings } from '../../src/config/settings';
import { closeDataSource, initializeDataSource } from '../../src/database/dataSource';
import { prepareTestEnvironment } from './testEnvironment';

async function createTestDatabaseIfMissing(testDatabaseUrl: string): Promise<void> {
  const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
  const maintenanceUrl = new URL(testDatabaseUrl);
  maintenanceUrl.pathname = '/postgres';

  const maintenanceClient = new Client({ connectionString: maintenanceUrl.toString() });
  await maintenanceClient.connect();
  const existingDatabase = await maintenanceClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [databaseName],
  );
  if (existingDatabase.rowCount === 0) {
    await maintenanceClient.query(`CREATE DATABASE "${databaseName}"`);
  }
  await maintenanceClient.end();
}

export async function setup(): Promise<void> {
  prepareTestEnvironment();
  await createTestDatabaseIfMissing(getSettings().databaseUrl);

  const dataSource = await initializeDataSource();
  await dataSource.runMigrations();
  await closeDataSource();
}
