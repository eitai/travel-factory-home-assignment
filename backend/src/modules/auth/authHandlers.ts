import { loginSchema, type LoginInput } from '@vacation-manager/shared';
import { parseJsonBody } from '../../services/requestParsingService';
import { authenticatedRoute, publicRoute, type InputParser } from '../../services/routeService';
import { loginWithPassword } from './authService';

export const parseLogin: InputParser<LoginInput> = (commonEvent) =>
  parseJsonBody(commonEvent, loginSchema);

export const handleLogin = publicRoute((credentials: LoginInput) => loginWithPassword(credentials));

export const handleGetCurrentUser = authenticatedRoute(
  async (_input: unknown, { currentUser }) => currentUser,
);
