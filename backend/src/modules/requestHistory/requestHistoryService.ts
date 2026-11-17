import { ForbiddenError } from '@casl/ability';
import {
  vacationRequestSubject,
  type VacationRequestHistoryEntryDto,
} from '@vacation-manager/shared';
import type { Actor } from '../../services/routeService';
import type { VacationRequestIdCommand } from '../vacationRequests/vacationRequestCommands';
import type { VacationRequestChangedEvent } from '../vacationRequests/vacationRequestEvents';
import { loadVacationRequest } from '../vacationRequests/vacationRequestService';
import type { VacationRequestEvent } from './VacationRequestEvent';
import {
  findEventsOfVacationRequest,
  insertVacationRequestEvent,
} from './requestHistoryRepository';

function toHistoryEntryDto(event: VacationRequestEvent): VacationRequestHistoryEntryDto {
  return {
    id: event.id,
    type: event.type,
    actorName: event.actor?.name ?? '',
    details: event.details,
    occurredAt: event.createdAt.toISOString(),
  };
}

export async function recordVacationRequestChange(
  changedEvent: VacationRequestChangedEvent,
): Promise<void> {
  await insertVacationRequestEvent(changedEvent);
}

export async function listVacationRequestHistory(
  command: VacationRequestIdCommand,
  actor: Actor,
): Promise<VacationRequestHistoryEntryDto[]> {
  const vacationRequest = await loadVacationRequest(command.vacationRequestId);
  ForbiddenError.from(actor.ability).throwUnlessCan(
    'readHistory',
    vacationRequestSubject(vacationRequest.userId),
  );

  const events = await findEventsOfVacationRequest(vacationRequest.id);
  return events.map(toHistoryEntryDto);
}
