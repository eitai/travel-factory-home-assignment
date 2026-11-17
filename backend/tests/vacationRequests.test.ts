import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { VacationRequestStatus } from '@vacation-manager/shared';
import {
  apiPath,
  bearer,
  createRequester,
  createValidator,
  daysFromToday,
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

function submit(user: TestUser, body: object) {
  return request(app).post(apiPath('/vacation-requests')).set(bearer(user)).send(body);
}

function approve(vacationRequestId: number) {
  return request(app)
    .post(apiPath(`/vacation-requests/${vacationRequestId}/approve`))
    .set(bearer(validator));
}

function reject(vacationRequestId: number, comment = 'Too many people are away') {
  return request(app)
    .post(apiPath(`/vacation-requests/${vacationRequestId}/reject`))
    .set(bearer(validator))
    .send({ comment });
}

describe('submitting a request', () => {
  it('creates a pending request owned by the requester', async () => {
    const response = await submit(requester, {
      startDate: daysFromToday(10),
      endDate: daysFromToday(12),
      reason: 'A short break',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      userId: requester.id,
      userName: requester.name,
      startDate: daysFromToday(10),
      endDate: daysFromToday(12),
      reason: 'A short break',
      status: VacationRequestStatus.Pending,
      comments: null,
    });
  });

  it('accepts a request without a reason', async () => {
    const response = await submit(requester, {
      startDate: daysFromToday(10),
      endDate: daysFromToday(12),
    });

    expect(response.status).toBe(201);
    expect(response.body.reason).toBeNull();
  });

  it('accepts a one-day vacation and a vacation starting today', async () => {
    const response = await submit(requester, {
      startDate: daysFromToday(0),
      endDate: daysFromToday(0),
    });

    expect(response.status).toBe(201);
  });

  it('rejects an end date before the start date', async () => {
    const response = await submit(requester, {
      startDate: daysFromToday(12),
      endDate: daysFromToday(10),
    });

    expect(response.status).toBe(400);
    expect(response.body.error.fields).toHaveProperty('endDate');
  });

  it('rejects a start date in the past', async () => {
    const response = await submit(requester, {
      startDate: daysFromToday(-1),
      endDate: daysFromToday(3),
    });

    expect(response.status).toBe(400);
    expect(response.body.error.fields).toHaveProperty('startDate');
  });

  it('rejects missing and malformed dates', async () => {
    const missingDates = await submit(requester, { reason: 'No dates' });
    const malformedDate = await submit(requester, { startDate: '12/01/2027', endDate: 'soon' });

    expect(missingDates.status).toBe(400);
    expect(Object.keys(missingDates.body.error.fields)).toEqual(['startDate', 'endDate']);
    expect(malformedDate.status).toBe(400);
  });

  it('refuses a validator, because only requesters submit', async () => {
    const response = await submit(validator, {
      startDate: daysFromToday(10),
      endDate: daysFromToday(12),
    });

    expect(response.status).toBe(403);
  });
});

describe('overlapping requests', () => {
  it('rejects dates that overlap a pending request of the same user', async () => {
    await submitVacation(app, requester, 10, 14);

    const response = await submit(requester, {
      startDate: daysFromToday(14),
      endDate: daysFromToday(16),
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DATES_OVERLAP');
    expect(response.body.error.fields).toHaveProperty('startDate');
  });

  it('rejects dates that overlap an approved request of the same user', async () => {
    const approvedRequest = await submitVacation(app, requester, 10, 14);
    await approve(approvedRequest.id);

    const response = await submit(requester, {
      startDate: daysFromToday(8),
      endDate: daysFromToday(10),
    });

    expect(response.status).toBe(409);
  });

  it('allows the same dates again after a rejection', async () => {
    const rejectedRequest = await submitVacation(app, requester, 10, 14);
    await reject(rejectedRequest.id);

    const response = await submit(requester, {
      startDate: daysFromToday(10),
      endDate: daysFromToday(14),
    });

    expect(response.status).toBe(201);
  });

  it('allows two different users to be away on the same dates', async () => {
    await submitVacation(app, requester, 10, 14);

    const response = await submit(otherRequester, {
      startDate: daysFromToday(10),
      endDate: daysFromToday(14),
    });

    expect(response.status).toBe(201);
  });

  it('lets only one of two identical requests sent at the same moment succeed', async () => {
    const sameDates = { startDate: daysFromToday(20), endDate: daysFromToday(22) };

    const responses = await Promise.all([
      submit(requester, sameDates),
      submit(requester, sameDates),
    ]);
    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([201, 409]);
  });
});

describe('listing my requests', () => {
  it('returns only my own requests, the latest vacation first', async () => {
    const earlierVacation = await submitVacation(app, requester, 10, 11);
    const laterVacation = await submitVacation(app, requester, 30, 31);
    await submitVacation(app, otherRequester, 10, 11);

    const response = await request(app)
      .get(apiPath('/users/me/vacation-requests'))
      .set(bearer(requester));

    expect(response.status).toBe(200);
    expect(response.body.items.map((item: { id: number }) => item.id)).toEqual([
      laterVacation.id,
      earlierVacation.id,
    ]);
    expect(response.body).toMatchObject({ page: 1, pageSize: 10, totalItems: 2, totalPages: 1 });
  });

  it('pages through the list and filters by status', async () => {
    const firstRequest = await submitVacation(app, requester, 10, 11);
    await submitVacation(app, requester, 20, 21);
    await submitVacation(app, requester, 30, 31);
    await approve(firstRequest.id);

    const secondPage = await request(app)
      .get(apiPath('/users/me/vacation-requests'))
      .query({ page: 2, pageSize: 2 })
      .set(bearer(requester));
    const approvedOnly = await request(app)
      .get(apiPath('/users/me/vacation-requests'))
      .query({ status: VacationRequestStatus.Approved })
      .set(bearer(requester));

    expect(secondPage.body).toMatchObject({ page: 2, pageSize: 2, totalItems: 3, totalPages: 2 });
    expect(secondPage.body.items).toHaveLength(1);
    expect(approvedOnly.body.items.map((item: { id: number }) => item.id)).toEqual([
      firstRequest.id,
    ]);
  });

  it('rejects paging values outside the allowed range', async () => {
    const response = await request(app)
      .get(apiPath('/users/me/vacation-requests'))
      .query({ page: 0, pageSize: 500 })
      .set(bearer(requester));

    expect(response.status).toBe(400);
    expect(Object.keys(response.body.error.fields)).toEqual(['page', 'pageSize']);
  });
});

describe('editing a request', () => {
  it('changes the dates and reason of a pending request', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12, 'First plan');

    const response = await request(app)
      .put(apiPath(`/vacation-requests/${vacationRequest.id}`))
      .set(bearer(requester))
      .send({ startDate: daysFromToday(11), endDate: daysFromToday(15), reason: 'Changed plan' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      startDate: daysFromToday(11),
      endDate: daysFromToday(15),
      reason: 'Changed plan',
      status: VacationRequestStatus.Pending,
    });
  });

  it('does not count the request being edited as an overlap with itself', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const response = await request(app)
      .put(apiPath(`/vacation-requests/${vacationRequest.id}`))
      .set(bearer(requester))
      .send({ startDate: daysFromToday(11), endDate: daysFromToday(13) });

    expect(response.status).toBe(200);
  });

  it('rejects new dates that overlap another request of the same user', async () => {
    await submitVacation(app, requester, 10, 12);
    const vacationRequest = await submitVacation(app, requester, 20, 22);

    const response = await request(app)
      .put(apiPath(`/vacation-requests/${vacationRequest.id}`))
      .set(bearer(requester))
      .send({ startDate: daysFromToday(12), endDate: daysFromToday(22) });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DATES_OVERLAP');
  });

  it('refuses to edit an approved request', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);
    await approve(vacationRequest.id);

    const response = await request(app)
      .put(apiPath(`/vacation-requests/${vacationRequest.id}`))
      .set(bearer(requester))
      .send({ startDate: daysFromToday(11), endDate: daysFromToday(13) });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('REQUEST_NOT_PENDING');
  });

  it('refuses to edit a request that belongs to someone else', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const response = await request(app)
      .put(apiPath(`/vacation-requests/${vacationRequest.id}`))
      .set(bearer(otherRequester))
      .send({ startDate: daysFromToday(11), endDate: daysFromToday(13) });

    expect(response.status).toBe(403);
  });

  it('answers with 404 for a request that does not exist', async () => {
    const response = await request(app)
      .put(apiPath('/vacation-requests/9999'))
      .set(bearer(requester))
      .send({ startDate: daysFromToday(11), endDate: daysFromToday(13) });
    const malformedId = await request(app)
      .put(apiPath('/vacation-requests/not-a-number'))
      .set(bearer(requester))
      .send({ startDate: daysFromToday(11), endDate: daysFromToday(13) });

    expect(response.status).toBe(404);
    expect(malformedId.status).toBe(404);
  });
});

describe('cancelling a request', () => {
  it('removes a pending request', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const response = await request(app)
      .delete(apiPath(`/vacation-requests/${vacationRequest.id}`))
      .set(bearer(requester));
    const myRequests = await request(app)
      .get(apiPath('/users/me/vacation-requests'))
      .set(bearer(requester));

    expect(response.status).toBe(204);
    expect(myRequests.body.totalItems).toBe(0);
  });

  it('refuses to cancel an approved or rejected request', async () => {
    const approvedRequest = await submitVacation(app, requester, 10, 12);
    const rejectedRequest = await submitVacation(app, requester, 20, 22);
    await approve(approvedRequest.id);
    await reject(rejectedRequest.id);

    const cancelApproved = await request(app)
      .delete(apiPath(`/vacation-requests/${approvedRequest.id}`))
      .set(bearer(requester));
    const cancelRejected = await request(app)
      .delete(apiPath(`/vacation-requests/${rejectedRequest.id}`))
      .set(bearer(requester));

    expect(cancelApproved.status).toBe(409);
    expect(cancelRejected.status).toBe(409);
  });

  it('refuses to cancel a request that belongs to someone else', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const response = await request(app)
      .delete(apiPath(`/vacation-requests/${vacationRequest.id}`))
      .set(bearer(otherRequester));

    expect(response.status).toBe(403);
  });
});
