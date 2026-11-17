import { loginSchema, type LoginInput } from '@vacation-manager/shared';
import { parseJsonBody } from '../../services/requestParsingService';
import { authenticatedRoute, publicRoute, type InputParser } from '../../services/routeService';
import { loginWithPassword } from './authService';

export const parseLogin: InputParser<LoginInput> = (event) => parseJsonBody(event, loginSchema);

export const login = publicRoute((credentials: LoginInput) => loginWithPassword(credentials));

export const getCurrentUser = authenticatedRoute(
  async (_input: unknown, { currentUser }) => currentUser,
);
