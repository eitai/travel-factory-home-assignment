import type { RequestHandler } from 'express';
import { getDataSource } from '../database/dataSource';

const SERVICE_UNAVAILABLE_STATUS = 503;

export const healthCheck: RequestHandler = async (_request, response) => {
  try {
    await getDataSource().query('SELECT 1');
    response.json({ status: 'ok' });
  } catch {
    response.status(SERVICE_UNAVAILABLE_STATUS).json({ status: 'unavailable' });
  }
};
