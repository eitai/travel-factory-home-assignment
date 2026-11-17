import type {
  PaginatedResult,
  VacationRequestDto,
  VacationRequestHistoryEntryDto,
  VacationRequestStatus,
} from '@vacation-manager/shared';
import { httpClient } from './httpClient';

export interface VacationRequestFormValues {
  startDate: string;
  endDate: string;
  reason: string | null;
}

export interface MyVacationRequestsFilters {
  status?: VacationRequestStatus;
  page: number;
}

export interface AllVacationRequestsFilters extends MyVacationRequestsFilters {
  userId?: number;
}

export async function fetchMyVacationRequests(
  filters: MyVacationRequestsFilters,
): Promise<PaginatedResult<VacationRequestDto>> {
  const response = await httpClient.get<PaginatedResult<VacationRequestDto>>(
    '/users/me/vacation-requests',
    { params: filters },
  );
  return response.data;
}

export async function fetchAllVacationRequests(
  filters: AllVacationRequestsFilters,
): Promise<PaginatedResult<VacationRequestDto>> {
  const response = await httpClient.get<PaginatedResult<VacationRequestDto>>('/vacation-requests', {
    params: filters,
  });
  return response.data;
}

export async function submitVacationRequest(
  formValues: VacationRequestFormValues,
): Promise<VacationRequestDto> {
  const response = await httpClient.post<VacationRequestDto>('/vacation-requests', formValues);
  return response.data;
}

export async function updateVacationRequest(
  vacationRequestId: number,
  formValues: VacationRequestFormValues,
): Promise<VacationRequestDto> {
  const response = await httpClient.put<VacationRequestDto>(
    `/vacation-requests/${vacationRequestId}`,
    formValues,
  );
  return response.data;
}

export async function cancelVacationRequest(vacationRequestId: number): Promise<void> {
  await httpClient.delete(`/vacation-requests/${vacationRequestId}`);
}

export async function approveVacationRequest(
  vacationRequestId: number,
): Promise<VacationRequestDto> {
  const response = await httpClient.post<VacationRequestDto>(
    `/vacation-requests/${vacationRequestId}/approve`,
  );
  return response.data;
}

export async function rejectVacationRequest(
  vacationRequestId: number,
  comment: string,
): Promise<VacationRequestDto> {
  const response = await httpClient.post<VacationRequestDto>(
    `/vacation-requests/${vacationRequestId}/reject`,
    { comment },
  );
  return response.data;
}

export async function fetchVacationRequestHistory(
  vacationRequestId: number,
): Promise<VacationRequestHistoryEntryDto[]> {
  const response = await httpClient.get<VacationRequestHistoryEntryDto[]>(
    `/vacation-requests/${vacationRequestId}/history`,
  );
  return response.data;
}
