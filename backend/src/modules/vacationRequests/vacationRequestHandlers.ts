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

export const parseSubmitVacationRequest: InputParser<SubmitVacationRequestCommand> = (event) =>
  parseJsonBody(event, createVacationRequestInputSchema(todayIsoDate()));

export const parseUpdateVacationRequest: InputParser<UpdateVacationRequestCommand> = (event) => ({
  vacationRequestId: parseIdParameter(event),
  changes: parseJsonBody(event, createVacationRequestInputSchema(todayIsoDate())),
});

export const parseVacationRequestId: InputParser<VacationRequestIdCommand> = (event) => ({
  vacationRequestId: parseIdParameter(event),
});

export const parseRejectVacationRequest: InputParser<RejectVacationRequestCommand> = (event) => ({
  vacationRequestId: parseIdParameter(event),
  comment: parseJsonBody(event, rejectVacationRequestSchema).comment,
});

export const parseListMyVacationRequests: InputParser<ListMyVacationRequestsQuery> = (event) =>
  parseQuery(event, myVacationRequestsQuerySchema);

export const parseListAllVacationRequests: InputParser<ListAllVacationRequestsQuery> = (event) =>
  parseQuery(event, allVacationRequestsQuerySchema);

export const submit = protectedRoute(
  { action: 'create', subject: 'VacationRequest' },
  async (command: SubmitVacationRequestCommand, actor) =>
    new Response(201, await submitVacationRequest(command, actor)),
);

export const listMine = protectedRoute(
  { action: 'read', subject: 'VacationRequest' },
  (query: ListMyVacationRequestsQuery, actor) => listMyVacationRequests(query, actor),
);

export const listAll = protectedRoute(
  { action: 'readAll', subject: 'VacationRequest' },
  (query: ListAllVacationRequestsQuery) => listAllVacationRequests(query),
);

export const update = protectedRoute(
  { action: 'update', subject: 'VacationRequest' },
  (command: UpdateVacationRequestCommand, actor) => updateVacationRequest(command, actor),
);

export const cancel = protectedRoute(
  { action: 'cancel', subject: 'VacationRequest' },
  async (command: VacationRequestIdCommand, actor) => {
    await cancelVacationRequest(command, actor);
    return new Response(204, {});
  },
);

export const approve = protectedRoute(
  { action: 'approve', subject: 'VacationRequest' },
  (command: VacationRequestIdCommand, actor) => approveVacationRequest(command, actor),
);

export const reject = protectedRoute(
  { action: 'reject', subject: 'VacationRequest' },
  (command: RejectVacationRequestCommand, actor) => rejectVacationRequest(command, actor),
);
