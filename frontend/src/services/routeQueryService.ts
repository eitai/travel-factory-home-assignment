import type { LocationQuery, LocationQueryRaw } from 'vue-router';

const FIRST_PAGE = 1;

export function readQueryText(query: LocationQuery, parameterName: string): string | undefined {
  const parameterValue = query[parameterName];
  return typeof parameterValue === 'string' && parameterValue !== '' ? parameterValue : undefined;
}

export function readQueryPositiveInteger(
  query: LocationQuery,
  parameterName: string,
): number | undefined {
  const queryText = readQueryText(query, parameterName);
  if (!queryText || !/^\d+$/.test(queryText)) {
    return undefined;
  }
  const parsedInteger = Number(queryText);
  return parsedInteger >= 1 ? parsedInteger : undefined;
}

export function readQueryPage(query: LocationQuery): number {
  return readQueryPositiveInteger(query, 'page') ?? FIRST_PAGE;
}

export function withoutEmptyValues(
  query: Record<string, string | number | undefined>,
): LocationQueryRaw {
  const cleanQuery: LocationQueryRaw = {};
  for (const [parameterName, parameterValue] of Object.entries(query)) {
    if (parameterValue !== undefined && parameterValue !== '') {
      cleanQuery[parameterName] = String(parameterValue);
    }
  }
  return cleanQuery;
}
