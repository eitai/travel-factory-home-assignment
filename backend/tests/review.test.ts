import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { VacationRequestStatus } from '@vacation-manager/shared';
import {
  apiPath,
  bearer,
  createRequester,
  createValidator,
  emptyDatabase,
  startTestApp,
  stopTestApp,
  submitVacation,
  type TestUser,
} from './support/testApp';

let app: Express;
let requester: TestUser;
let otherRequester: TestUser;
let validator: TestUser;

beforeAll(async () => {
  app = await startTestApp();
});

beforeEach(async () => {
  await emptyDatabase();
  requester = await createRequester(app);
  otherRequester = await createRequester(app, 'Other Requester');
  validator = await createValidator(app);
});

afterAll(stopTestApp);

function listAll(user: TestUser, query: object = {}) {
  return request(app).get(apiPath('/vacation-requests')).query(query).set(bearer(user));
}

function approve(user: TestUser, vacationRequestId: number) {
  return request(app)
    .post(apiPath(`/vacation-requests/${vacationRequestId}/approve`))
    .set(bearer(user));
}

function reject(user: TestUser, vacationRequestId: number, body: object) {
  return request(app)
    .post(apiPath(`/vacation-requests/${vacationRequestId}/reject`))
    .set(bearer(user))
    .send(body);
}

describe('the review dashboard', () => {
  it('shows a validator the requests of every user, newest first', async () => {
    const firstRequest = await submitVacation(app, requester, 10, 12);
    const secondRequest = await submitVacation(app, otherRequester, 10, 12);

    const response = await listAll(validator);

    expect(response.status).toBe(200);
    expect(response.body.items.map((item: { id: number }) => item.id)).toEqual([
      secondRequest.id,
      firstRequest.id,
    ]);
    expect(response.body.items[0].userName).toBe(otherRequester.name);
  });

  it('is closed to requesters', async () => {
    const response = await listAll(requester);

    expect(response.status).toBe(403);
  });

  it('filters by status and by user', async () => {
    const pendingRequest = await submitVacation(app, requester, 10, 12);
    const approvedRequest = await submitVacation(app, requester, 20, 22);
    const otherUsersRequest = await submitVacation(app, otherRequester, 10, 12);
    await approve(validator, approvedRequest.id);

    const pendingOnly = await listAll(validator, { status: VacationRequestStatus.Pending });
    const oneUserOnly = await listAll(validator, { userId: otherRequester.id });
    const bothFilters = await listAll(validator, {
      status: VacationRequestStatus.Approved,
      userId: requester.id,
    });

    const idsOf = (response: { body: { items: { id: number }[] } }) =>
      response.body.items.map((item) => item.id).sort();
    expect(idsOf(pendingOnly)).toEqual([pendingRequest.id, otherUsersRequest.id].sort());
    expect(idsOf(oneUserOnly)).toEqual([otherUsersRequest.id]);
    expect(idsOf(bothFilters)).toEqual([approvedRequest.id]);
  });

  it('pages through the list with correct totals', async () => {
    for (let requestNumber = 0; requestNumber < 5; requestNumber += 1) {
      await submitVacation(app, requester, 10 + requestNumber * 3, 11 + requestNumber * 3);
    }

    const firstPage = await listAll(validator, { page: 1, pageSize: 2 });
    const lastPage = await listAll(validator, { page: 3, pageSize: 2 });

    expect(firstPage.body).toMatchObject({ page: 1, pageSize: 2, totalItems: 5, totalPages: 3 });
    expect(firstPage.body.items).toHaveLength(2);
    expect(lastPage.body.items).toHaveLength(1);
  });

  it('rejects a status that does not exist', async () => {
    const response = await listAll(validator, { status: 'MAYBE' });

    expect(response.status).toBe(400);
    expect(response.body.error.fields).toHaveProperty('status');
  });
});

describe('approving and rejecting', () => {
  it('approves a pending request', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const response = await approve(validator, vacationRequest.id);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(VacationRequestStatus.Approved);
    expect(response.body.comments).toBeNull();
  });

  it('rejects a pending request and keeps the comment', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const response = await reject(validator, vacationRequest.id, {
      comment: '  The team is at a conference that week.  ',
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(VacationRequestStatus.Rejected);
    expect(response.body.comments).toBe('The team is at a conference that week.');
  });

  it('requires a comment to reject', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const missingComment = await reject(validator, vacationRequest.id, {});
    const blankComment = await reject(validator, vacationRequest.id, { comment: '   ' });

    expect(missingComment.status).toBe(400);
    expect(blankComment.status).toBe(400);
    expect(blankComment.body.error.fields).toHaveProperty('comment');
  });

  it('lets only validators approve or reject', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const approveAsRequester = await approve(requester, vacationRequest.id);
    const rejectAsRequester = await reject(requester, vacationRequest.id, { comment: 'No' });

    expect(approveAsRequester.status).toBe(403);
    expect(rejectAsRequester.status).toBe(403);
  });

  it('refuses to decide a request twice', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);
    await approve(validator, vacationRequest.id);

    const approveAgain = await approve(validator, vacationRequest.id);
    const rejectAfterApproval = await reject(validator, vacationRequest.id, { comment: 'Changed' });

    expect(approveAgain.status).toBe(409);
    expect(rejectAfterApproval.status).toBe(409);
    expect(approveAgain.body.error.code).toBe('REQUEST_NOT_PENDING');
  });

  it('lets only one of two decisions made at the same moment succeed', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);
    const secondValidator = await createValidator(app, 'Second Validator');

    const responses = await Promise.all([
      approve(validator, vacationRequest.id),
      reject(secondValidator, vacationRequest.id, { comment: 'Not this week' }),
    ]);
    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([200, 409]);
  });

  it('answers with 404 for a request that does not exist', async () => {
    const response = await approve(validator, 9999);

    expect(response.status).toBe(404);
  });
});

describe('the user list for the filter', () => {
  it('gives a validator the requesters, sorted by name', async () => {
    const response = await request(app).get(apiPath('/users')).set(bearer(validator));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: otherRequester.id, name: otherRequester.name },
      { id: requester.id, name: requester.name },
    ]);
  });

  it('is closed to requesters', async () => {
    const response = await request(app).get(apiPath('/users')).set(bearer(requester));

    expect(response.status).toBe(403);
  });
});
