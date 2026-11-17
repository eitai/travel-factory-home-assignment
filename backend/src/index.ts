import { loadEnv } from 'commoneventframework';
import { createApp } from './app';
import { getSettings } from './config/settings';
import { closeDataSource, initializeDataSource } from './database/dataSource';

async function start(): Promise<void> {
  await loadEnv();
  const settings = getSettings();
  await initializeDataSource();

  const server = createApp().listen(settings.port, () => {
    console.log(`Vacation Manager API listening on http://localhost:${settings.port}`);
  });

  const shutDown = (): void => {
    server.close(() => {
      void closeDataSource().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutDown);
  process.on('SIGINT', shutDown);
}

start().catch((error: unknown) => {
  console.error('The API could not start.', error);
  process.exit(1);
});
