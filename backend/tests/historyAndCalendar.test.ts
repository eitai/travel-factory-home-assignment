import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { VacationRequestEventType, VacationRequestStatus } from '@vacation-manager/shared';
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

function readHistory(user: TestUser, vacationRequestId: number) {
  return request(app)
    .get(apiPath(`/vacation-requests/${vacationRequestId}/history`))
    .set(bearer(user));
}

describe('request history, recorded from events', () => {
  it('records who submitted, edited and approved a request, in order', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);
    await request(app)
      .put(apiPath(`/vacation-requests/${vacationRequest.id}`))
      .set(bearer(requester))
      .send({ startDate: daysFromToday(11), endDate: daysFromToday(13) });
    await request(app)
      .post(apiPath(`/vacation-requests/${vacationRequest.id}/approve`))
      .set(bearer(validator));

    const response = await readHistory(requester, vacationRequest.id);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([
      {
        type: VacationRequestEventType.Submitted,
        actorName: requester.name,
        details: { startDate: daysFromToday(10), endDate: daysFromToday(12) },
      },
      {
        type: VacationRequestEventType.Updated,
        actorName: requester.name,
        details: { startDate: daysFromToday(11), endDate: daysFromToday(13) },
      },
      { type: VacationRequestEventType.Approved, actorName: validator.name, details: null },
    ]);
  });

  it('records a rejection with its comment', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);
    await request(app)
      .post(apiPath(`/vacation-requests/${vacationRequest.id}/reject`))
      .set(bearer(validator))
      .send({ comment: 'Release week' });

    const response = await readHistory(validator, vacationRequest.id);

    expect(response.body).toHaveLength(2);
    expect(response.body[1]).toMatchObject({
      type: VacationRequestEventType.Rejected,
      actorName: validator.name,
      details: { comment: 'Release week' },
    });
  });

  it('does not record anything when a change is refused', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);
    await request(app)
      .post(apiPath(`/vacation-requests/${vacationRequest.id}/approve`))
      .set(bearer(requester));

    const response = await readHistory(requester, vacationRequest.id);

    expect(response.body).toHaveLength(1);
  });

  it('keeps the history of a request private to its owner and to validators', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const asOtherRequester = await readHistory(otherRequester, vacationRequest.id);
    const asValidator = await readHistory(validator, vacationRequest.id);

    expect(asOtherRequester.status).toBe(403);
    expect(asValidator.status).toBe(200);
  });

  it('refuses the event route when it is called over HTTP', async () => {
    const vacationRequest = await submitVacation(app, requester, 10, 12);

    const response = await request(app)
      .put(apiPath('/events/vacation-request-changed'))
      .set(bearer(validator))
      .send({
        type: VacationRequestEventType.Approved,
        vacationRequestId: vacationRequest.id,
        actorUserId: validator.id,
        details: null,
      });
    const history = await readHistory(requester, vacationRequest.id);

    expect(response.status).toBe(404);
    expect(history.body).toHaveLength(1);
  });
});

describe('the team calendar', () => {
  function readCalendar(user: TestUser, query: object) {
    return request(app).get(apiPath('/team-calendar')).query(query).set(bearer(user));
  }

  it('shows approved and pending vacations of every requester, without reasons', async () => {
    const pendingRequest = await submitVacation(app, requester, 10, 12, 'Private reason');
    const approvedRequest = await submitVacation(app, otherRequester, 11, 13);
    const rejectedRequest = await submitVacation(app, otherRequester, 20, 21);
    await request(app)
      .post(apiPath(`/vacation-requests/${approvedRequest.id}/approve`))
      .set(bearer(validator));
    await request(app)
      .post(apiPath(`/vacation-requests/${rejectedRequest.id}/reject`))
      .set(bearer(validator))
      .send({ comment: 'Not possible' });

    const response = await readCalendar(requester, {
      from: daysFromToday(0),
      to: daysFromToday(30),
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        userId: otherRequester.id,
        userName: otherRequester.name,
        vacations: [
          {
            vacationRequestId: approvedRequest.id,
            startDate: daysFromToday(11),
            endDate: daysFromToday(13),
            status: VacationRequestStatus.Approved,
          },
        ],
      },
      {
        userId: requester.id,
        userName: requester.name,
        vacations: [
          {
            vacationRequestId: pendingRequest.id,
            startDate: daysFromToday(10),
            endDate: daysFromToday(12),
            status: VacationRequestStatus.Pending,
          },
        ],
      },
    ]);
  });

  it('includes vacations that only partly fall inside the period', async () => {
    await submitVacation(app, requester, 8, 12);

    const response = await readCalendar(validator, {
      from: daysFromToday(12),
      to: daysFromToday(20),
    });

    const calendarOfRequester = response.body.find(
      (member: { userId: number }) => member.userId === requester.id,
    );
    expect(calendarOfRequester.vacations).toHaveLength(1);
  });

  it('rejects a period that is reversed or too long', async () => {
    const reversedPeriod = await readCalendar(requester, {
      from: daysFromToday(10),
      to: daysFromToday(5),
    });
    const tooLongPeriod = await readCalendar(requester, {
      from: daysFromToday(0),
      to: daysFromToday(200),
    });

    expect(reversedPeriod.status).toBe(400);
    expect(tooLongPeriod.status).toBe(400);
  });
});
