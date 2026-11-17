import type { LoginInput, LoginResponseDto } from '@vacation-manager/shared';
import { unauthorized } from '../../services/errorService';
import { verifyPassword } from '../../services/passwordService';
import { signAccessToken } from '../../services/tokenService';
import { findUserByEmailWithPassword } from '../users/userRepository';
import { toUserDto } from '../users/userService';

export async function loginWithPassword(credentials: LoginInput): Promise<LoginResponseDto> {
  const user = await findUserByEmailWithPassword(credentials.email);
  const isPasswordCorrect = user
    ? await verifyPassword(credentials.password, user.password)
    : false;

  if (!user || !isPasswordCorrect) {
    throw unauthorized('INVALID_CREDENTIALS', 'The email or password is incorrect');
  }

  const userDto = toUserDto(user);
  return { token: signAccessToken(userDto), user: userDto };
}
