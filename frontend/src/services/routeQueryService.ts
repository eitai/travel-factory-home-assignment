import type { LocationQuery, LocationQueryRaw } from 'vue-router';

const FIRST_PAGE = 1;

export function readQueryText(query: LocationQuery, parameterName: string): string | undefined {
  const value = query[parameterName];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

export function readQueryPositiveInteger(
  query: LocationQuery,
  parameterName: string,
): number | undefined {
  const text = readQueryText(query, parameterName);
  if (!text || !/^\d+$/.test(text)) {
    return undefined;
  }
  const value = Number(text);
  return value >= 1 ? value : undefined;
}

export function readQueryPage(query: LocationQuery): number {
  return readQueryPositiveInteger(query, 'page') ?? FIRST_PAGE;
}

export function withoutEmptyValues(
  query: Record<string, string | number | undefined>,
): LocationQueryRaw {
  const cleanQuery: LocationQueryRaw = {};
  for (const [parameterName, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      cleanQuery[parameterName] = String(value);
    }
  }
  return cleanQuery;
}
