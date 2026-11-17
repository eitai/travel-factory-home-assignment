import { protectedRoute } from '../../services/routeService';
import { listRequesterSummaries } from './userService';

export const listUsers = protectedRoute({ action: 'read', subject: 'User' }, () =>
  listRequesterSummaries(),
);
