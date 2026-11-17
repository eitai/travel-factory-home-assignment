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

function toHistoryEntryDto(
  vacationRequestEvent: VacationRequestEvent,
): VacationRequestHistoryEntryDto {
  return {
    id: vacationRequestEvent.id,
    type: vacationRequestEvent.type,
    actorName: vacationRequestEvent.actor?.name ?? '',
    details: vacationRequestEvent.details,
    occurredAt: vacationRequestEvent.createdAt.toISOString(),
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

  const vacationRequestEvents = await findEventsOfVacationRequest(vacationRequest.id);
  return vacationRequestEvents.map(toHistoryEntryDto);
}
