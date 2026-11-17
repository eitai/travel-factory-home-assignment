import type { Role } from '@vacation-manager/shared';
import { getDataSource } from '../../database/dataSource';
import { User } from './User';

function getUserRepository() {
  return getDataSource().getRepository(User);
}

export function findUserByEmailWithPassword(email: string): Promise<User | null> {
  return getUserRepository()
    .createQueryBuilder('user')
    .addSelect('user.password')
    .where('user.email = :email', { email })
    .getOne();
}

export function findUsersByRole(role: Role): Promise<User[]> {
  return getUserRepository().find({ where: { role }, order: { name: 'ASC', id: 'ASC' } });
}

export function findUserById(userId: number): Promise<User | null> {
  return getUserRepository().findOne({ where: { id: userId } });
}

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export function insertUser(newUser: NewUser): Promise<User> {
  const userRepository = getUserRepository();
  return userRepository.save(
    userRepository.create({
      name: newUser.name,
      email: newUser.email,
      password: newUser.passwordHash,
      role: newUser.role,
    }),
  );
}
