import type { Role } from './roles';
import type { IsoDate } from './services/timeService';
import type { VacationRequestEventType } from './vacationRequestEventType';
import type { VacationRequestStatus } from './vacationRequestStatus';

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface UserSummaryDto {
  id: number;
  name: string;
}

export interface LoginResponseDto {
  token: string;
  user: UserDto;
}

export interface VacationRequestDto {
  id: number;
  userId: number;
  userName: string;
  startDate: IsoDate;
  endDate: IsoDate;
  reason: string | null;
  status: VacationRequestStatus;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<Item> {
  items: Item[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface TeamCalendarVacationDto {
  vacationRequestId: number;
  startDate: IsoDate;
  endDate: IsoDate;
  status: VacationRequestStatus;
}

export interface TeamCalendarMemberDto {
  userId: number;
  userName: string;
  vacations: TeamCalendarVacationDto[];
}

export interface VacationRequestHistoryDetails {
  startDate?: IsoDate;
  endDate?: IsoDate;
  comment?: string;
}

export interface VacationRequestHistoryEntryDto {
  id: number;
  type: VacationRequestEventType;
  actorName: string;
  details: VacationRequestHistoryDetails | null;
  occurredAt: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}
