import { ForbiddenError } from '@casl/ability';
import {
  canVacationRequestBeChanged,
  formatDate,
  VacationRequestEventType,
  VacationRequestStatus,
  vacationRequestSubject,
  type DateRange,
  type PaginatedResult,
  type VacationRequestDto,
} from '@vacation-manager/shared';
import { conflict, notFound } from '../../services/errorService';
import { toPageWindow, toPaginatedResult } from '../../services/paginationService';
import type { Actor } from '../../services/routeService';
import type { VacationRequest } from './VacationRequest';
import type {
  ListAllVacationRequestsQuery,
  ListMyVacationRequestsQuery,
  RejectVacationRequestCommand,
  SubmitVacationRequestCommand,
  UpdateVacationRequestCommand,
  VacationRequestIdCommand,
} from './vacationRequestCommands';
import { publishVacationRequestChanged } from './vacationRequestEvents';
import {
  decidePendingVacationRequest,
  deletePendingVacationRequest,
  findOverlappingVacationRequest,
  findVacationRequestById,
  findVacationRequestPageForReview,
  findVacationRequestPageForUser,
  insertVacationRequest,
  updatePendingVacationRequest,
} from './vacationRequestRepository';

export function toVacationRequestDto(vacationRequest: VacationRequest): VacationRequestDto {
  return {
    id: vacationRequest.id,
    userId: vacationRequest.userId,
    userName: vacationRequest.user?.name ?? '',
    startDate: vacationRequest.startDate,
    endDate: vacationRequest.endDate,
    reason: vacationRequest.reason,
    status: vacationRequest.status,
    comments: vacationRequest.comments,
    createdAt: vacationRequest.createdAt.toISOString(),
    updatedAt: vacationRequest.updatedAt.toISOString(),
  };
}

export async function loadVacationRequest(vacationRequestId: number): Promise<VacationRequest> {
  const vacationRequest = await findVacationRequestById(vacationRequestId);
  if (!vacationRequest) {
    throw notFound('This vacation request does not exist');
  }
  return vacationRequest;
}

function requestNoLongerPending(status: VacationRequestStatus) {
  return conflict(
    'REQUEST_NOT_PENDING',
    `Only a pending request can be changed. This one is already ${status.toLowerCase()}.`,
  );
}

function assertStillPending(vacationRequest: VacationRequest): void {
  if (!canVacationRequestBeChanged(vacationRequest.status)) {
    throw requestNoLongerPending(vacationRequest.status);
  }
}

async function assertNoOverlap(
  userId: number,
  dateRange: DateRange,
  ignoredVacationRequestId?: number,
): Promise<void> {
  const overlappingRequest = await findOverlappingVacationRequest(
    userId,
    dateRange,
    ignoredVacationRequestId,
  );
  if (overlappingRequest) {
    const overlappingDates = `${formatDate(overlappingRequest.startDate)} to ${formatDate(overlappingRequest.endDate)}`;
    const message = `These dates overlap another request (${overlappingDates})`;
    throw conflict('DATES_OVERLAP', message, { startDate: message });
  }
}

export async function submitVacationRequest(
  command: SubmitVacationRequestCommand,
  actor: Actor,
): Promise<VacationRequestDto> {
  const requesterId = actor.currentUser.id;
  await assertNoOverlap(requesterId, command);

  const createdRequest = await insertVacationRequest({ userId: requesterId, ...command });
  await publishVacationRequestChanged({
    type: VacationRequestEventType.Submitted,
    vacationRequestId: createdRequest.id,
    actorUserId: requesterId,
    details: { startDate: command.startDate, endDate: command.endDate },
  });
  return toVacationRequestDto(await loadVacationRequest(createdRequest.id));
}

export async function listMyVacationRequests(
  query: ListMyVacationRequestsQuery,
  actor: Actor,
): Promise<PaginatedResult<VacationRequestDto>> {
  const [vacationRequests, totalItems] = await findVacationRequestPageForUser(
    actor.currentUser.id,
    query.status,
    toPageWindow(query),
  );
  return toPaginatedResult(vacationRequests.map(toVacationRequestDto), totalItems, query);
}

export async function listAllVacationRequests(
  query: ListAllVacationRequestsQuery,
): Promise<PaginatedResult<VacationRequestDto>> {
  const [vacationRequests, totalItems] = await findVacationRequestPageForReview(
    { status: query.status, userId: query.userId },
    toPageWindow(query),
  );
  return toPaginatedResult(vacationRequests.map(toVacationRequestDto), totalItems, query);
}

export async function updateVacationRequest(
  command: UpdateVacationRequestCommand,
  actor: Actor,
): Promise<VacationRequestDto> {
  const vacationRequest = await loadVacationRequest(command.vacationRequestId);
  ForbiddenError.from(actor.ability).throwUnlessCan(
    'update',
    vacationRequestSubject(vacationRequest.userId),
  );
  assertStillPending(vacationRequest);
  await assertNoOverlap(vacationRequest.userId, command.changes, vacationRequest.id);

  const wasUpdated = await updatePendingVacationRequest(vacationRequest.id, command.changes);
  if (!wasUpdated) {
    throw requestNoLongerPending((await loadVacationRequest(vacationRequest.id)).status);
  }

  await publishVacationRequestChanged({
    type: VacationRequestEventType.Updated,
    vacationRequestId: vacationRequest.id,
    actorUserId: actor.currentUser.id,
    details: { startDate: command.changes.startDate, endDate: command.changes.endDate },
  });
  return toVacationRequestDto(await loadVacationRequest(vacationRequest.id));
}

export async function cancelVacationRequest(
  command: VacationRequestIdCommand,
  actor: Actor,
): Promise<void> {
  const vacationRequest = await loadVacationRequest(command.vacationRequestId);
  ForbiddenError.from(actor.ability).throwUnlessCan(
    'cancel',
    vacationRequestSubject(vacationRequest.userId),
  );
  assertStillPending(vacationRequest);

  const wasDeleted = await deletePendingVacationRequest(vacationRequest.id);
  if (!wasDeleted) {
    throw requestNoLongerPending((await loadVacationRequest(vacationRequest.id)).status);
  }
}

async function decideVacationRequest(
  vacationRequestId: number,
  decision: typeof VacationRequestStatus.Approved | typeof VacationRequestStatus.Rejected,
  comment: string | null,
  actor: Actor,
): Promise<VacationRequestDto> {
  const vacationRequest = await loadVacationRequest(vacationRequestId);
  assertStillPending(vacationRequest);

  const wasDecided = await decidePendingVacationRequest(vacationRequest.id, decision, comment);
  if (!wasDecided) {
    throw requestNoLongerPending((await loadVacationRequest(vacationRequest.id)).status);
  }

  const isApproval = decision === VacationRequestStatus.Approved;
  await publishVacationRequestChanged({
    type: isApproval ? VacationRequestEventType.Approved : VacationRequestEventType.Rejected,
    vacationRequestId: vacationRequest.id,
    actorUserId: actor.currentUser.id,
    details: comment ? { comment } : null,
  });
  return toVacationRequestDto(await loadVacationRequest(vacationRequest.id));
}

export function approveVacationRequest(
  command: VacationRequestIdCommand,
  actor: Actor,
): Promise<VacationRequestDto> {
  return decideVacationRequest(
    command.vacationRequestId,
    VacationRequestStatus.Approved,
    null,
    actor,
  );
}

export function rejectVacationRequest(
  command: RejectVacationRequestCommand,
  actor: Actor,
): Promise<VacationRequestDto> {
  return decideVacationRequest(
    command.vacationRequestId,
    VacationRequestStatus.Rejected,
    command.comment,
    actor,
  );
}
