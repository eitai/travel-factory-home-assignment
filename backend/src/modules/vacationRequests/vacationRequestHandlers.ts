import { Response } from 'commoneventframework';
import {
  allVacationRequestsQuerySchema,
  createVacationRequestInputSchema,
  myVacationRequestsQuerySchema,
  rejectVacationRequestSchema,
  todayIsoDate,
} from '@vacation-manager/shared';
import { parseIdParameter, parseJsonBody, parseQuery } from '../../services/requestParsingService';
import { protectedRoute, type InputParser } from '../../services/routeService';
import type {
  ListAllVacationRequestsQuery,
  ListMyVacationRequestsQuery,
  RejectVacationRequestCommand,
  SubmitVacationRequestCommand,
  UpdateVacationRequestCommand,
  VacationRequestIdCommand,
} from './vacationRequestCommands';
import {
  approveVacationRequest,
  cancelVacationRequest,
  listAllVacationRequests,
  listMyVacationRequests,
  rejectVacationRequest,
  submitVacationRequest,
  updateVacationRequest,
} from './vacationRequestService';

export const parseSubmitVacationRequest: InputParser<SubmitVacationRequestCommand> = (
  commonEvent,
) => parseJsonBody(commonEvent, createVacationRequestInputSchema(todayIsoDate()));

export const parseUpdateVacationRequest: InputParser<UpdateVacationRequestCommand> = (
  commonEvent,
) => ({
  vacationRequestId: parseIdParameter(commonEvent),
  changes: parseJsonBody(commonEvent, createVacationRequestInputSchema(todayIsoDate())),
});

export const parseVacationRequestId: InputParser<VacationRequestIdCommand> = (commonEvent) => ({
  vacationRequestId: parseIdParameter(commonEvent),
});

export const parseRejectVacationRequest: InputParser<RejectVacationRequestCommand> = (
  commonEvent,
) => ({
  vacationRequestId: parseIdParameter(commonEvent),
  comment: parseJsonBody(commonEvent, rejectVacationRequestSchema).comment,
});

export const parseListMyVacationRequests: InputParser<ListMyVacationRequestsQuery> = (
  commonEvent,
) => parseQuery(commonEvent, myVacationRequestsQuerySchema);

export const parseListAllVacationRequests: InputParser<ListAllVacationRequestsQuery> = (
  commonEvent,
) => parseQuery(commonEvent, allVacationRequestsQuerySchema);

export const handleSubmitVacationRequest = protectedRoute(
  { action: 'create', subject: 'VacationRequest' },
  async (command: SubmitVacationRequestCommand, actor) =>
    new Response(201, await submitVacationRequest(command, actor)),
);

export const handleListMyVacationRequests = protectedRoute(
  { action: 'read', subject: 'VacationRequest' },
  (query: ListMyVacationRequestsQuery, actor) => listMyVacationRequests(query, actor),
);

export const handleListAllVacationRequests = protectedRoute(
  { action: 'readAll', subject: 'VacationRequest' },
  (query: ListAllVacationRequestsQuery) => listAllVacationRequests(query),
);

export const handleUpdateVacationRequest = protectedRoute(
  { action: 'update', subject: 'VacationRequest' },
  (command: UpdateVacationRequestCommand, actor) => updateVacationRequest(command, actor),
);

export const handleCancelVacationRequest = protectedRoute(
  { action: 'cancel', subject: 'VacationRequest' },
  async (command: VacationRequestIdCommand, actor) => {
    await cancelVacationRequest(command, actor);
    return new Response(204, {});
  },
);

export const handleApproveVacationRequest = protectedRoute(
  { action: 'approve', subject: 'VacationRequest' },
  (command: VacationRequestIdCommand, actor) => approveVacationRequest(command, actor),
);

export const handleRejectVacationRequest = protectedRoute(
  { action: 'reject', subject: 'VacationRequest' },
  (command: RejectVacationRequestCommand, actor) => rejectVacationRequest(command, actor),
);
