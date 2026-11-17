import { loadEnv } from 'commoneventframework';
import {
  addDays,
  Role,
  todayIsoDate,
  VacationRequestEventType,
  VacationRequestStatus,
} from '@vacation-manager/shared';
import { insertVacationRequestEvent } from '../modules/requestHistory/requestHistoryRepository';
import { User } from '../modules/users/User';
import { insertUser } from '../modules/users/userRepository';
import {
  decidePendingVacationRequest,
  insertVacationRequest,
} from '../modules/vacationRequests/vacationRequestRepository';
import { hashPassword } from '../services/passwordService';
import { closeDataSource, initializeDataSource } from './dataSource';

const DEMO_PASSWORD = 'Password123!';

const demoValidator = { name: 'Validator One', email: 'validator@example.com' };

const demoRequesters = [
  { name: 'Requester One', email: 'requester1@example.com' },
  { name: 'Requester Two', email: 'requester2@example.com' },
  { name: 'Requester Three', email: 'requester3@example.com' },
];

interface DemoVacationRequest {
  requesterIndex: number;
  startsInDays: number;
  lengthInDays: number;
  reason: string | null;
  status: VacationRequestStatus;
  rejectionComment?: string;
}

const demoVacationRequests: DemoVacationRequest[] = [
  {
    requesterIndex: 0,
    startsInDays: 6,
    lengthInDays: 5,
    reason: 'Family trip',
    status: VacationRequestStatus.Approved,
  },
  {
    requesterIndex: 0,
    startsInDays: 20,
    lengthInDays: 2,
    reason: null,
    status: VacationRequestStatus.Pending,
  },
  {
    requesterIndex: 0,
    startsInDays: 34,
    lengthInDays: 3,
    reason: 'Long weekend',
    status: VacationRequestStatus.Rejected,
    rejectionComment: 'Two teammates are already away that week. Please pick other dates.',
  },
  {
    requesterIndex: 0,
    startsInDays: 48,
    lengthInDays: 10,
    reason: 'Summer holiday',
    status: VacationRequestStatus.Pending,
  },
  {
    requesterIndex: 0,
    startsInDays: 70,
    lengthInDays: 1,
    reason: 'Moving day',
    status: VacationRequestStatus.Approved,
  },
  {
    requesterIndex: 1,
    startsInDays: 3,
    lengthInDays: 1,
    reason: 'Medical appointment',
    status: VacationRequestStatus.Approved,
  },
  {
    requesterIndex: 1,
    startsInDays: 8,
    lengthInDays: 4,
    reason: null,
    status: VacationRequestStatus.Pending,
  },
  {
    requesterIndex: 1,
    startsInDays: 25,
    lengthInDays: 7,
    reason: 'Visiting relatives',
    status: VacationRequestStatus.Approved,
  },
  {
    requesterIndex: 1,
    startsInDays: 40,
    lengthInDays: 2,
    reason: null,
    status: VacationRequestStatus.Rejected,
    rejectionComment: 'This overlaps the quarterly planning days.',
  },
  {
    requesterIndex: 1,
    startsInDays: 55,
    lengthInDays: 3,
    reason: 'Wedding',
    status: VacationRequestStatus.Pending,
  },
  {
    requesterIndex: 2,
    startsInDays: 10,
    lengthInDays: 3,
    reason: null,
    status: VacationRequestStatus.Pending,
  },
  {
    requesterIndex: 2,
    startsInDays: 18,
    lengthInDays: 5,
    reason: 'Ski trip',
    status: VacationRequestStatus.Approved,
  },
  {
    requesterIndex: 2,
    startsInDays: 37,
    lengthInDays: 1,
    reason: null,
    status: VacationRequestStatus.Pending,
  },
  {
    requesterIndex: 2,
    startsInDays: 62,
    lengthInDays: 6,
    reason: 'Honeymoon',
    status: VacationRequestStatus.Pending,
  },
];

async function seedDemoData(): Promise<void> {
  await loadEnv();
  const dataSource = await initializeDataSource();

  const existingUserCount = await dataSource.getRepository(User).count();
  if (existingUserCount > 0) {
    console.log('Demo data is already loaded.');
    await closeDataSource();
    return;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const validator = await insertUser({ ...demoValidator, passwordHash, role: Role.Validator });
  const requesters = [];
  for (const demoRequester of demoRequesters) {
    requesters.push(await insertUser({ ...demoRequester, passwordHash, role: Role.Requester }));
  }

  const today = todayIsoDate();
  for (const demoRequest of demoVacationRequests) {
    const requester = requesters[demoRequest.requesterIndex];
    if (!requester) {
      continue;
    }
    const startDate = addDays(today, demoRequest.startsInDays);
    const endDate = addDays(startDate, demoRequest.lengthInDays - 1);

    const vacationRequest = await insertVacationRequest({
      userId: requester.id,
      startDate,
      endDate,
      reason: demoRequest.reason,
    });
    await insertVacationRequestEvent({
      vacationRequestId: vacationRequest.id,
      type: VacationRequestEventType.Submitted,
      actorUserId: requester.id,
      details: { startDate, endDate },
    });

    if (demoRequest.status === VacationRequestStatus.Pending) {
      continue;
    }
    const comment = demoRequest.rejectionComment ?? null;
    await decidePendingVacationRequest(vacationRequest.id, demoRequest.status, comment);
    await insertVacationRequestEvent({
      vacationRequestId: vacationRequest.id,
      type:
        demoRequest.status === VacationRequestStatus.Approved
          ? VacationRequestEventType.Approved
          : VacationRequestEventType.Rejected,
      actorUserId: validator.id,
      details: comment ? { comment } : null,
    });
  }

  console.log(
    `Loaded ${requesters.length + 1} demo users and ${demoVacationRequests.length} vacation requests. Password for every account: ${DEMO_PASSWORD}`,
  );
  await closeDataSource();
}

seedDemoData().catch((error: unknown) => {
  console.error('Loading the demo data failed.', error);
  process.exitCode = 1;
});
