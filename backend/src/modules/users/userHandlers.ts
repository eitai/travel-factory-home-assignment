import { protectedRoute } from '../../services/routeService';
import { listRequesterSummaries } from './userService';

export const handleListUsers = protectedRoute({ action: 'read', subject: 'User' }, () =>
  listRequesterSummaries(),
);
