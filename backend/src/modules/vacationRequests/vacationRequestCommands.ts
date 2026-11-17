import type {
  AllVacationRequestsQuery,
  MyVacationRequestsQuery,
  VacationRequestInput,
} from '@vacation-manager/shared';

export type SubmitVacationRequestCommand = VacationRequestInput;

export interface UpdateVacationRequestCommand {
  vacationRequestId: number;
  changes: VacationRequestInput;
}

export interface VacationRequestIdCommand {
  vacationRequestId: number;
}

export interface RejectVacationRequestCommand {
  vacationRequestId: number;
  comment: string;
}

export type ListMyVacationRequestsQuery = MyVacationRequestsQuery;
export type ListAllVacationRequestsQuery = AllVacationRequestsQuery;
