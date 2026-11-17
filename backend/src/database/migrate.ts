import { loadEnv } from 'commoneventframework';
import { closeDataSource, initializeDataSource } from './dataSource';

async function runMigrations(): Promise<void> {
  await loadEnv();
  const dataSource = await initializeDataSource();
  const appliedMigrations = await dataSource.runMigrations();

  if (appliedMigrations.length === 0) {
    console.log('The database schema is already up to date.');
  } else {
    const migrationNames = appliedMigrations.map((migration) => migration.name).join(', ');
    console.log(`Applied migrations: ${migrationNames}`);
  }
  await closeDataSource();
}

runMigrations().catch((error: unknown) => {
  console.error('The migrations failed.', error);
  process.exitCode = 1;
});
