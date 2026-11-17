import { parseJsonBody } from '../../services/requestParsingService';
import { internalRoute, protectedRoute, type InputParser } from '../../services/routeService';
import type { VacationRequestIdCommand } from '../vacationRequests/vacationRequestCommands';
import {
  vacationRequestChangedEventSchema,
  type VacationRequestChangedEvent,
} from '../vacationRequests/vacationRequestEvents';
import { listVacationRequestHistory, recordVacationRequestChange } from './requestHistoryService';

export const parseVacationRequestChangedEvent: InputParser<VacationRequestChangedEvent> = (
  commonEvent,
) => parseJsonBody(commonEvent, vacationRequestChangedEventSchema);

export const handleVacationRequestChangedEvent = internalRoute(
  (changedEvent: VacationRequestChangedEvent) => recordVacationRequestChange(changedEvent),
);

export const handleGetVacationRequestHistory = protectedRoute(
  { action: 'readHistory', subject: 'VacationRequest' },
  (command: VacationRequestIdCommand, actor) => listVacationRequestHistory(command, actor),
);
