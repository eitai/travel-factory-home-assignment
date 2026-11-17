import type {
  VacationRequestEventType,
  VacationRequestHistoryDetails,
} from '@vacation-manager/shared';
import { getDataSource } from '../../database/dataSource';
import { VacationRequestEvent } from './VacationRequestEvent';

function getVacationRequestEventRepository() {
  return getDataSource().getRepository(VacationRequestEvent);
}

export interface NewVacationRequestEvent {
  vacationRequestId: number;
  type: VacationRequestEventType;
  actorUserId: number;
  details: VacationRequestHistoryDetails | null;
}

export function insertVacationRequestEvent(
  newEvent: NewVacationRequestEvent,
): Promise<VacationRequestEvent> {
  const eventRepository = getVacationRequestEventRepository();
  return eventRepository.save(eventRepository.create(newEvent));
}

export function findEventsOfVacationRequest(
  vacationRequestId: number,
): Promise<VacationRequestEvent[]> {
  return getVacationRequestEventRepository().find({
    where: { vacationRequestId },
    relations: { actor: true },
    order: { createdAt: 'ASC', id: 'ASC' },
  });
}
