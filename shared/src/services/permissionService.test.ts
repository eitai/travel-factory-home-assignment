import { describe, expect, it } from 'vitest';
import { defineAbilityFor, defineGuestAbility, vacationRequestSubject } from './permissionService';
import { Role } from '../roles';

const requester = { id: 1, role: Role.Requester };
const validator = { id: 2, role: Role.Validator };

describe('requester', () => {
  const ability = defineAbilityFor(requester);

  it('can submit a request and read the team calendar', () => {
    expect(ability.can('create', 'VacationRequest')).toBe(true);
    expect(ability.can('read', 'TeamCalendar')).toBe(true);
  });

  it('can change and cancel only their own requests', () => {
    expect(ability.can('update', vacationRequestSubject(requester.id))).toBe(true);
    expect(ability.can('cancel', vacationRequestSubject(requester.id))).toBe(true);
    expect(ability.can('update', vacationRequestSubject(99))).toBe(false);
    expect(ability.can('cancel', vacationRequestSubject(99))).toBe(false);
  });

  it('can read the history of only their own requests', () => {
    expect(ability.can('readHistory', vacationRequestSubject(requester.id))).toBe(true);
    expect(ability.can('readHistory', vacationRequestSubject(99))).toBe(false);
  });

  it('cannot approve, reject, list everyone or read the user list', () => {
    expect(ability.can('approve', 'VacationRequest')).toBe(false);
    expect(ability.can('reject', 'VacationRequest')).toBe(false);
    expect(ability.can('readAll', 'VacationRequest')).toBe(false);
    expect(ability.can('read', 'User')).toBe(false);
  });
});

describe('validator', () => {
  const ability = defineAbilityFor(validator);

  it('can list, approve and reject every request and read any history', () => {
    expect(ability.can('readAll', 'VacationRequest')).toBe(true);
    expect(ability.can('approve', 'VacationRequest')).toBe(true);
    expect(ability.can('reject', 'VacationRequest')).toBe(true);
    expect(ability.can('readHistory', vacationRequestSubject(99))).toBe(true);
    expect(ability.can('read', 'User')).toBe(true);
  });

  it('cannot submit, change or cancel requests', () => {
    expect(ability.can('create', 'VacationRequest')).toBe(false);
    expect(ability.can('update', vacationRequestSubject(validator.id))).toBe(false);
    expect(ability.can('cancel', vacationRequestSubject(validator.id))).toBe(false);
  });
});

describe('guest', () => {
  it('can do nothing', () => {
    const ability = defineGuestAbility();
    expect(ability.can('read', 'TeamCalendar')).toBe(false);
    expect(ability.can('create', 'VacationRequest')).toBe(false);
  });
});
