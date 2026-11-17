import { DataSource } from 'typeorm';
import { getSettings } from '../config/settings';
import { VacationRequestEvent } from '../modules/requestHistory/VacationRequestEvent';
import { User } from '../modules/users/User';
import { VacationRequest } from '../modules/vacationRequests/VacationRequest';
import { InitialSchema1794947115672 } from './migrations/1794947115672-InitialSchema';

let cachedDataSource: DataSource | undefined;

export function getDataSource(): DataSource {
  cachedDataSource ??= new DataSource({
    type: 'postgres',
    url: getSettings().databaseUrl,
    entities: [User, VacationRequest, VacationRequestEvent],
    migrations: [InitialSchema1794947115672],
    synchronize: false,
  });
  return cachedDataSource;
}

export async function initializeDataSource(): Promise<DataSource> {
  const dataSource = getDataSource();
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource;
}

export async function closeDataSource(): Promise<void> {
  if (cachedDataSource?.isInitialized) {
    await cachedDataSource.destroy();
  }
  cachedDataSource = undefined;
}
