import type { CommonEvent } from 'commoneventframework/dist/types/commonEvent';
import type { z } from 'zod';
import { badRequest, notFound } from './errorService';

function readJson(event: CommonEvent): unknown {
  if (!event.body) {
    return {};
  }
  try {
    return JSON.parse(event.body);
  } catch {
    throw badRequest('The request body is not valid JSON');
  }
}

export function parseJsonBody<Schema extends z.ZodType>(
  event: CommonEvent,
  schema: Schema,
): z.infer<Schema> {
  return schema.parse(readJson(event));
}

export function parseQuery<Schema extends z.ZodType>(
  event: CommonEvent,
  schema: Schema,
): z.infer<Schema> {
  return schema.parse(event.queryStringParameters ?? {});
}

export function parseIdParameter(event: CommonEvent, parameterName = 'id'): number {
  const rawValue = event.pathParameters?.[parameterName] ?? '';
  const id = Number(rawValue);
  if (!/^\d+$/.test(rawValue) || !Number.isSafeInteger(id) || id < 1) {
    throw notFound();
  }
  return id;
}
