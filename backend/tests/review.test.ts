import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { VacationRequestStatus } from '@vacation-manager/shared';
import {
  apiPath,
  authorizationHeader,
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

function listAllRequests(user: TestUser, query: object = {}) {
  return request(app)
    .get(apiPath('/vacation-requests'))
    .query(query)
    .set(authorizationHeader(user));
}

function approveRequest(user: TestUser, vacationRequestId: number) {
  return request(app)
    .post(apiPath(`/vacation-requests/${vacationRequestId}/approve`))
    .set(authorizationHeader(user));
}

function rejectRequest(user: TestUser, vacationRequestId: number, requestBody: object) {
  return request(app)
    .post(apiPath(`/vacation-requests/${vacationRequestId}/reject`))
    .set(authorizationHeader(user))
    .send(requestBody);
}

describe('the review dashboard', () => {
  it('shows a validator the requests of every user, newest first', async () => {
    const firstRequest = await submitVacation(app, requester, 10, 12);
    const secondRequest = await submitVacation(app, otherRequester, 10, 12);

    const response = await listAllRequests(validator);

    expect(response.status).toBe(200);
    expect(
      response.body.items.map((vacationRequest: { id: number }) => vacationRequest.id),
    ).toEqual([secondRequest.id, firstRequest.id]);
    expect(response.body.items[0].userName).toBe(otherRequester.name);
  });

  it('is closed to requesters', async () => {
    const response = await listAllRequests(requester);

    expect(response.status).toBe(403);
  });

  it('filters by status and by user', async () => {
    const pendingRequest = await submitVacation(app, requester, 10, 12);
    const approvedRequest = await submitVacation(app, requester, 20, 22);
    const otherUsersRequest = await submitVacation(app, otherRequester, 10, 12);
    await approveRequest(validator, approvedRequest.id);

    const pendingOnly = await listAllRequests(validator, { status: VacationRequestStatus.Pending });
    const oneUserOnly = await listAllRequests(validator, { userId: otherRequester.id });
    const bothFilters = await listAllRequests(validator, {
      status: VacationRequestStatus.Approved,
      userId: requester.id,
    });

    const readRequestIds = (response: { body: { items: { id: number }[] } }) =>
      response.body.items.map((vacationRequest) => vacationRequest.id).sort();
    expect(readRequestIds(pendingOnly)).toEqual([pendingRequest.id, otherUsersRequest.id].sort());
    expect(readRequestIds(oneUserOnly)).toEqual([otherUsersRequest.id]);
    expect(readRequestIds(bothFilters)).toEqual([approvedRequest.id]);
  });

  it('pages through the list with correct totals', async () => {
    for (let requestNumber = 0; requestNumber < 5; requestNumber += 1) {
      await submitVacation(app, requester, 10 + requestNumber * 3, 11 + requestNumber * 3);
    }

    const firstPage = await listAllRequests(validator, { page: 1, pageSize: 2 });
    const lastPage = await listAllRequests(validator, { page: 3, pageSize: 2 });

    expect(firstPage.body).toMatchObject({ page: 1, pageSize: 2, totalItems: 5, totalPages: 3 });
    expect(firstPage.body.items).toHaveLength(2);
    expect(lastPage.body.items).toHaveLength(1);
  });

  it('rejects a status that does not exist', async () => {
    const response = await listAllRequests(validator, { status: 'MAYBE' });

    expect(response.status).toBe(400);
    expect(response.body.error.fields).toHaveProperty('status');
  });
});

describe('approving and rejecting', () => {
  it('approves a pending request', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const response = await approveRequest(validator, vacationRequest.id);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(VacationRequestStatus.Approved);
    expect(response.body.comments).toBeNull();
  });

  it('rejects a pending request and keeps the comment', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const response = await rejectRequest(validator, vacationRequest.id, {
      comment: '  The team is at a conference that week.  ',
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(VacationRequestStatus.Rejected);
    expect(response.body.comments).toBe('The team is at a conference that week.');
  });

  it('requires a comment to reject', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const missingComment = await rejectRequest(validator, vacationRequest.id, {});
    const blankComment = await rejectRequest(validator, vacationRequest.id, { comment: '   ' });

    expect(missingComment.status).toBe(400);
    expect(blankComment.status).toBe(400);
    expect(blankComment.body.error.fields).toHaveProperty('comment');
  });

  it('lets only validators approve or reject', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const approveAsRequester = await approveRequest(requester, vacationRequest.id);
    const rejectAsRequester = await rejectRequest(requester, vacationRequest.id, { comment: 'No' });

    expect(approveAsRequester.status).toBe(403);
    expect(rejectAsRequester.status).toBe(403);
  });

  it('refuses to decide a request twice', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);
    await approveRequest(validator, vacationRequest.id);

    const approveAgain = await approveRequest(validator, vacationRequest.id);
    const rejectAfterApproval = await rejectRequest(validator, vacationRequest.id, {
      comment: 'Changed',
    });

    expect(approveAgain.status).toBe(409);
    expect(rejectAfterApproval.status).toBe(409);
    expect(approveAgain.body.error.code).toBe('REQUEST_NOT_PENDING');
  });

  it('lets only one of two decisions made at the same moment succeed', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);
    const secondValidator = await createValidator(app, 'Second Validator');

    const responses = await Promise.all([
      approveRequest(validator, vacationRequest.id),
      rejectRequest(secondValidator, vacationRequest.id, { comment: 'Not this week' }),
    ]);
    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([200, 409]);
  });

  it('answers with 404 for a request that does not exist', async () => {
    const response = await approveRequest(validator, 9999);

    expect(response.status).toBe(404);
  });
});

describe('the user list for the filter', () => {
  it('gives a validator the requesters, sorted by name', async () => {
    const response = await request(app).get(apiPath('/users')).set(authorizationHeader(validator));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: otherRequester.id, name: otherRequester.name },
      { id: requester.id, name: requester.name },
    ]);
  });

  it('is closed to requesters', async () => {
    const response = await request(app).get(apiPath('/users')).set(authorizationHeader(requester));

    expect(response.status).toBe(403);
  });
});
