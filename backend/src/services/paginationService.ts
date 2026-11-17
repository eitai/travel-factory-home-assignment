import type { PaginatedResult, PaginationQuery } from '@vacation-manager/shared';

export interface PageWindow {
  skip: number;
  take: number;
}

export function toPageWindow(pagination: PaginationQuery): PageWindow {
  return {
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
  };
}

export function toPaginatedResult<Item>(
  items: Item[],
  totalItems: number,
  pagination: PaginationQuery,
): PaginatedResult<Item> {
  return {
    items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pagination.pageSize)),
  };
}
