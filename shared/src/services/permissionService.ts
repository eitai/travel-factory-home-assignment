import {
  AbilityBuilder,
  createMongoAbility,
  subject,
  type CreateAbility,
  type ForcedSubject,
  type MongoAbility,
} from '@casl/ability';
import { Role } from '../roles';

export const permissionActions = [
  'create',
  'read',
  'update',
  'cancel',
  'readHistory',
  'readAll',
  'approve',
  'reject',
] as const;

export const permissionSubjects = ['VacationRequest', 'User', 'TeamCalendar'] as const;

export type PermissionAction = (typeof permissionActions)[number];
export type PermissionSubject = (typeof permissionSubjects)[number];

export interface VacationRequestOwnership {
  userId: number;
}

type OwnedVacationRequest = VacationRequestOwnership & ForcedSubject<'VacationRequest'>;

export type AppAbility = MongoAbility<
  | [PermissionAction, 'VacationRequest' | OwnedVacationRequest]
  | [PermissionAction, Exclude<PermissionSubject, 'VacationRequest'>]
>;

export interface Permission {
  action: PermissionAction;
  subject: PermissionSubject;
}

export interface PermissionHolder {
  id: number;
  role: Role;
}

type DefinePermissions = (user: PermissionHolder, builder: AbilityBuilder<AppAbility>) => void;

const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

const rolePermissions: Record<Role, DefinePermissions> = {
  [Role.Requester](user, { can }) {
    can('create', 'VacationRequest');
    can(['read', 'update', 'cancel', 'readHistory'], 'VacationRequest', { userId: user.id });
    can('read', 'TeamCalendar');
  },
  [Role.Validator](_user, { can }) {
    can(['readAll', 'readHistory', 'approve', 'reject'], 'VacationRequest');
    can('read', 'User');
    can('read', 'TeamCalendar');
  },
};

export function defineAbilityFor(user: PermissionHolder): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createAppAbility);
  rolePermissions[user.role](user, builder);
  return builder.build();
}

export function defineGuestAbility(): AppAbility {
  return new AbilityBuilder<AppAbility>(createAppAbility).build();
}

export function vacationRequestSubject(ownerUserId: number) {
  return subject('VacationRequest', { userId: ownerUserId });
}
