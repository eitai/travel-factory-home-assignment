import type { FindOptionsWhere } from 'typeorm';
import { VacationRequestStatus, type DateRange, type IsoDate } from '@vacation-manager/shared';
import { getDataSource } from '../../database/dataSource';
import type { PageWindow } from '../../services/paginationService';
import { VacationRequest } from './VacationRequest';

function getVacationRequestRepository() {
  return getDataSource().getRepository(VacationRequest);
}

export interface NewVacationRequest extends DateRange {
  userId: number;
  reason: string | null;
}

export interface VacationRequestChanges extends DateRange {
  reason: string | null;
}

export interface VacationRequestFilters {
  userId?: number;
  status?: VacationRequestStatus;
}

export function insertVacationRequest(newRequest: NewVacationRequest): Promise<VacationRequest> {
  const vacationRequestRepository = getVacationRequestRepository();
  return vacationRequestRepository.save(vacationRequestRepository.create(newRequest));
}

export function findVacationRequestById(
  vacationRequestId: number,
): Promise<VacationRequest | null> {
  return getVacationRequestRepository().findOne({
    where: { id: vacationRequestId },
    relations: { user: true },
  });
}

export function findOverlappingVacationRequest(
  userId: number,
  dateRange: DateRange,
  ignoredVacationRequestId?: number,
): Promise<VacationRequest | null> {
  const query = getVacationRequestRepository()
    .createQueryBuilder('vacationRequest')
    .where('vacationRequest.userId = :userId', { userId })
    .andWhere('vacationRequest.status <> :rejected', { rejected: VacationRequestStatus.Rejected })
    .andWhere('vacationRequest.startDate <= :endDate', { endDate: dateRange.endDate })
    .andWhere('vacationRequest.endDate >= :startDate', { startDate: dateRange.startDate });

  if (ignoredVacationRequestId !== undefined) {
    query.andWhere('vacationRequest.id <> :ignoredVacationRequestId', { ignoredVacationRequestId });
  }
  return query.orderBy('vacationRequest.startDate', 'ASC').getOne();
}

function toFilterConditions(filters: VacationRequestFilters): FindOptionsWhere<VacationRequest> {
  const filterConditions: FindOptionsWhere<VacationRequest> = {};
  if (filters.userId !== undefined) {
    filterConditions.userId = filters.userId;
  }
  if (filters.status !== undefined) {
    filterConditions.status = filters.status;
  }
  return filterConditions;
}

export function findVacationRequestPageForUser(
  userId: number,
  status: VacationRequestStatus | undefined,
  pageWindow: PageWindow,
): Promise<[VacationRequest[], number]> {
  return getVacationRequestRepository().findAndCount({
    where: toFilterConditions({ userId, status }),
    relations: { user: true },
    order: { startDate: 'DESC', id: 'DESC' },
    ...pageWindow,
  });
}

export function findVacationRequestPageForReview(
  filters: VacationRequestFilters,
  pageWindow: PageWindow,
): Promise<[VacationRequest[], number]> {
  return getVacationRequestRepository().findAndCount({
    where: toFilterConditions(filters),
    relations: { user: true },
    order: { createdAt: 'DESC', id: 'DESC' },
    ...pageWindow,
  });
}

async function writeIfStillPending(
  vacationRequestId: number,
  columnValues: Partial<
    Pick<VacationRequest, 'startDate' | 'endDate' | 'reason' | 'status' | 'comments'>
  >,
): Promise<boolean> {
  const updateResult = await getVacationRequestRepository()
    .createQueryBuilder()
    .update()
    .set(columnValues)
    .where('id = :vacationRequestId', { vacationRequestId })
    .andWhere('status = :pending', { pending: VacationRequestStatus.Pending })
    .execute();
  return updateResult.affected === 1;
}

export function updatePendingVacationRequest(
  vacationRequestId: number,
  changes: VacationRequestChanges,
): Promise<boolean> {
  return writeIfStillPending(vacationRequestId, changes);
}

export function decidePendingVacationRequest(
  vacationRequestId: number,
  status: VacationRequestStatus,
  comments: string | null,
): Promise<boolean> {
  return writeIfStillPending(vacationRequestId, { status, comments });
}

export async function deletePendingVacationRequest(vacationRequestId: number): Promise<boolean> {
  const deleteResult = await getVacationRequestRepository()
    .createQueryBuilder()
    .delete()
    .where('id = :vacationRequestId', { vacationRequestId })
    .andWhere('status = :pending', { pending: VacationRequestStatus.Pending })
    .execute();
  return deleteResult.affected === 1;
}

export function findActiveVacationRequestsBetween(
  firstDay: IsoDate,
  lastDay: IsoDate,
): Promise<VacationRequest[]> {
  return getVacationRequestRepository()
    .createQueryBuilder('vacationRequest')
    .where('vacationRequest.status <> :rejected', { rejected: VacationRequestStatus.Rejected })
    .andWhere('vacationRequest.startDate <= :lastDay', { lastDay })
    .andWhere('vacationRequest.endDate >= :firstDay', { firstDay })
    .orderBy('vacationRequest.startDate', 'ASC')
    .addOrderBy('vacationRequest.id', 'ASC')
    .getMany();
}
