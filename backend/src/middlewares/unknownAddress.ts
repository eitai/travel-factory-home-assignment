import type { RequestHandler } from 'express';
import { notFound } from '../services/errorService';

export const rejectUnknownAddress: RequestHandler = () => {
  throw notFound('This address does not exist');
};
