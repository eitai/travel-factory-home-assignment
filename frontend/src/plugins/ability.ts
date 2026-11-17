import {
  defineAbilityFor,
  defineGuestAbility,
  type AppAbility,
  type UserDto,
} from '@vacation-manager/shared';

export const ability: AppAbility = defineGuestAbility();

export function applyAbilityFor(user: UserDto | null): void {
  ability.update(user ? defineAbilityFor(user).rules : []);
}
