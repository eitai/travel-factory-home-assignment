import type { UserDto } from '@vacation-manager/shared';

declare global {
  namespace Express {
    interface User extends UserDto {}
  }
}

export {};
