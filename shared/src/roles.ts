export const Role = {
  Requester: 'REQUESTER',
  Validator: 'VALIDATOR',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const roleValues = Object.values(Role);
