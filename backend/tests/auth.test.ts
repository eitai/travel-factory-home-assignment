import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Role } from '@vacation-manager/shared';
import { createApp } from '../src/app';
import { getSettings } from '../src/config/settings';
import { TOKEN_ISSUER } from '../src/services/tokenService';
import {
  apiPath,
  authorizationHeader,
  createRequester,
  emptyDatabase,
  startTestApp,
  stopTestApp,
  TEST_PASSWORD,
  type TestUser,
} from './support/testApp';

let app: Express;
let requester: TestUser;

beforeAll(async () => {
  app = await startTestApp();
});

beforeEach(async () => {
  await emptyDatabase();
  requester = await createRequester(app);
});

afterAll(stopTestApp);

describe('signing in', () => {
  it('returns a token and the user, without the password', async () => {
    const response = await request(app)
      .post(apiPath('/auth/login'))
      .send({ email: requester.email, password: TEST_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toEqual({
      id: requester.id,
      name: requester.name,
      email: requester.email,
      role: Role.Requester,
    });
  });

  it('accepts the email in any letter case', async () => {
    const response = await request(app)
      .post(apiPath('/auth/login'))
      .send({ email: requester.email.toUpperCase(), password: TEST_PASSWORD });

    expect(response.status).toBe(200);
  });

  it('answers a wrong password and an unknown email with the same message', async () => {
    const wrongPassword = await request(app)
      .post(apiPath('/auth/login'))
      .send({ email: requester.email, password: 'not-the-password' });
    const unknownEmail = await request(app)
      .post(apiPath('/auth/login'))
      .send({ email: 'nobody@example.com', password: TEST_PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('reports missing fields by name', async () => {
    const response = await request(app)
      .post(apiPath('/auth/login'))
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(Object.keys(response.body.error.fields)).toEqual(['email', 'password']);
  });

  it('rejects a body that is not valid JSON', async () => {
    const response = await request(app)
      .post(apiPath('/auth/login'))
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(response.status).toBe(400);
  });

  it('blocks further attempts after too many failures', async () => {
    const appWithFreshCounter = createApp();
    const attemptWrongLogin = () =>
      request(appWithFreshCounter)
        .post(apiPath('/auth/login'))
        .send({ email: requester.email, password: 'not-the-password' });

    for (let attemptNumber = 0; attemptNumber < 10; attemptNumber += 1) {
      expect((await attemptWrongLogin()).status).toBe(401);
    }
    const blockedAttempt = await attemptWrongLogin();

    expect(blockedAttempt.status).toBe(429);
    expect(blockedAttempt.body.error.code).toBe('TOO_MANY_ATTEMPTS');
  });
});

describe('using a token', () => {
  it('returns the signed-in user', async () => {
    const response = await request(app)
      .get(apiPath('/auth/me'))
      .set(authorizationHeader(requester));

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(requester.email);
  });

  it('refuses a request without a token', async () => {
    const response = await request(app).get(apiPath('/auth/me'));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('refuses a token that is not a token', async () => {
    const response = await request(app)
      .get(apiPath('/auth/me'))
      .set({ Authorization: 'Bearer not-a-real-token' });

    expect(response.status).toBe(401);
  });

  it('refuses an expired token', async () => {
    const oneMinuteAgoInSeconds = Math.floor(Date.now() / 1000) - 60;
    const expiredToken = jwt.sign(
      {
        name: requester.name,
        email: requester.email,
        role: Role.Requester,
        exp: oneMinuteAgoInSeconds,
      },
      getSettings().jwtSecret,
      { issuer: TOKEN_ISSUER, subject: String(requester.id) },
    );

    const response = await request(app)
      .get(apiPath('/auth/me'))
      .set({ Authorization: `Bearer ${expiredToken}` });

    expect(response.status).toBe(401);
  });

  it('refuses a token signed with a different secret', async () => {
    const forgedToken = jwt.sign(
      { name: requester.name, email: requester.email, role: Role.Validator },
      'a-secret-the-server-does-not-know-about',
      { issuer: TOKEN_ISSUER, subject: String(requester.id), expiresIn: '1h' },
    );

    const response = await request(app)
      .get(apiPath('/vacation-requests'))
      .set({ Authorization: `Bearer ${forgedToken}` });

    expect(response.status).toBe(401);
  });
});

describe('addresses that do not exist', () => {
  it('answers with a 404 in the standard error shape', async () => {
    const insideApi = await request(app)
      .get(apiPath('/nothing-here'))
      .set(authorizationHeader(requester));
    const outsideApi = await request(app).get('/nothing-here');

    expect(insideApi.status).toBe(404);
    expect(outsideApi.status).toBe(404);
    expect(outsideApi.body.error.code).toBe('NOT_FOUND');
  });

  it('reports the health of the API', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
