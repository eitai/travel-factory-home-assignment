import { Role, type UserDto, type UserSummaryDto } from '@vacation-manager/shared';
import type { User } from './User';
import { findUsersByRole } from './userRepository';

export function toUserDto(user: User): UserDto {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function listRequesterSummaries(): Promise<UserSummaryDto[]> {
  const requesters = await findUsersByRole(Role.Requester);
  return requesters.map((requester) => ({ id: requester.id, name: requester.name }));
}
