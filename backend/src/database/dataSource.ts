import { DataSource } from 'typeorm';
import { getSettings } from '../config/settings';
import { VacationRequestEvent } from '../modules/requestHistory/VacationRequestEvent';
import { User } from '../modules/users/User';
import { VacationRequest } from '../modules/vacationRequests/VacationRequest';
import { InitialSchema1794947115672 } from './migrations/1794947115672-InitialSchema';

let dataSource: DataSource | undefined;

export function getDataSource(): DataSource {
  dataSource ??= new DataSource({
    type: 'postgres',
    url: getSettings().databaseUrl,
    entities: [User, VacationRequest, VacationRequestEvent],
    migrations: [InitialSchema1794947115672],
    synchronize: false,
  });
  return dataSource;
}

export async function initializeDataSource(): Promise<DataSource> {
  const connection = getDataSource();
  if (!connection.isInitialized) {
    await connection.initialize();
  }
  return connection;
}

export async function closeDataSource(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
  dataSource = undefined;
}
