import type { CommonEvent } from 'commoneventframework/dist/types/commonEvent';
import type { z } from 'zod';
import { badRequest, notFound } from './errorService';

function readJson(commonEvent: CommonEvent): unknown {
  if (!commonEvent.body) {
    return {};
  }
  try {
    return JSON.parse(commonEvent.body);
  } catch {
    throw badRequest('The request body is not valid JSON');
  }
}

export function parseJsonBody<Schema extends z.ZodType>(
  commonEvent: CommonEvent,
  schema: Schema,
): z.infer<Schema> {
  return schema.parse(readJson(commonEvent));
}

export function parseQuery<Schema extends z.ZodType>(
  commonEvent: CommonEvent,
  schema: Schema,
): z.infer<Schema> {
  return schema.parse(commonEvent.queryStringParameters ?? {});
}

export function parseIdParameter(commonEvent: CommonEvent, parameterName = 'id'): number {
  const rawValue = commonEvent.pathParameters?.[parameterName] ?? '';
  const id = Number(rawValue);
  if (!/^\d+$/.test(rawValue) || !Number.isSafeInteger(id) || id < 1) {
    throw notFound();
  }
  return id;
}
