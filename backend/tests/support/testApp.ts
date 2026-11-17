import type { Express } from 'express';
import request from 'supertest';
import {
  addDays,
  Role,
  todayIsoDate,
  type LoginResponseDto,
  type VacationRequestDto,
} from '@vacation-manager/shared';
import { API_PREFIX, createApp } from '../../src/app';
import {
  closeDataSource,
  getDataSource,
  initializeDataSource,
} from '../../src/database/dataSource';
import { insertUser } from '../../src/modules/users/userRepository';
import { hashPassword } from '../../src/services/passwordService';

export const TEST_PASSWORD = 'correct-horse-battery';

export interface TestUser {
  id: number;
  name: string;
  email: string;
  token: string;
}

export async function startTestApp(): Promise<Express> {
  await initializeDataSource();
  return createApp();
}

export async function stopTestApp(): Promise<void> {
  await closeDataSource();
}

export async function emptyDatabase(): Promise<void> {
  await getDataSource().query(
    'TRUNCATE TABLE vacation_request_events, vacation_requests, users RESTART IDENTITY CASCADE',
  );
}

export function apiPath(routePath: string): string {
  return `${API_PREFIX}${routePath}`;
}

export function daysFromToday(dayCount: number): string {
  return addDays(todayIsoDate(), dayCount);
}

export async function createSignedInUser(
  app: Express,
  role: Role,
  name: string,
): Promise<TestUser> {
  const email = `${name.toLowerCase().replaceAll(' ', '.')}@example.com`;
  const user = await insertUser({
    name,
    email,
    passwordHash: await hashPassword(TEST_PASSWORD),
    role,
  });
  const loginResponse = await request(app)
    .post(apiPath('/auth/login'))
    .send({ email, password: TEST_PASSWORD });
  const { token } = loginResponse.body as LoginResponseDto;
  return { id: user.id, name, email, token };
}

export function createRequester(app: Express, name = 'Riley Requester'): Promise<TestUser> {
  return createSignedInUser(app, Role.Requester, name);
}

export function createValidator(app: Express, name = 'Val Validator'): Promise<TestUser> {
  return createSignedInUser(app, Role.Validator, name);
}

export function bearer(user: TestUser): { Authorization: string } {
  return { Authorization: `Bearer ${user.token}` };
}

export async function submitVacation(
  app: Express,
  requester: TestUser,
  startsInDays: number,
  endsInDays: number,
  reason?: string,
): Promise<VacationRequestDto> {
  const response = await request(app)
    .post(apiPath('/vacation-requests'))
    .set(bearer(requester))
    .send({ startDate: daysFromToday(startsInDays), endDate: daysFromToday(endsInDays), reason });
  if (response.status !== 201) {
    throw new Error(`Submitting failed with ${response.status}: ${JSON.stringify(response.body)}`);
  }
  return response.body as VacationRequestDto;
}
