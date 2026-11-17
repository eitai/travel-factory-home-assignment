import type { CommonEvent } from 'commoneventframework/dist/types/commonEvent';
import type { AppAbility, Permission, UserDto } from '@vacation-manager/shared';

export type RouteAccess =
  | { kind: 'public' }
  | { kind: 'authenticated' }
  | { kind: 'internal' }
  | { kind: 'permission'; permission: Permission };

export interface Actor {
  currentUser: UserDto;
  ability: AppAbility;
}

export interface AnonymousContext {
  event: CommonEvent;
}

export interface RequestContext extends AnonymousContext, Actor {}

export type InputParser<Input = unknown> = (event: CommonEvent) => Input;

type Handle<Input, Context> = (input: Input, context: Context) => Promise<unknown>;

export interface RouteHandler {
  (input: unknown, context: RequestContext | AnonymousContext): Promise<unknown>;
  access: RouteAccess;
}

function withAccess<Input, Context>(
  access: RouteAccess,
  handle: Handle<Input, Context>,
): RouteHandler {
  return Object.assign(handle as Handle<unknown, unknown>, { access });
}

export function publicRoute<Input>(handle: Handle<Input, AnonymousContext>): RouteHandler {
  return withAccess({ kind: 'public' }, handle);
}

export function authenticatedRoute<Input>(handle: Handle<Input, RequestContext>): RouteHandler {
  return withAccess({ kind: 'authenticated' }, handle);
}

export function protectedRoute<Input>(
  permission: Permission,
  handle: Handle<Input, RequestContext>,
): RouteHandler {
  return withAccess({ kind: 'permission', permission }, handle);
}

export function internalRoute<Input>(handle: Handle<Input, AnonymousContext>): RouteHandler {
  return withAccess({ kind: 'internal' }, handle);
}

export function readRouteAccess(candidate: unknown): RouteAccess | undefined {
  if (typeof candidate === 'function' && 'access' in candidate) {
    return candidate.access as RouteAccess;
  }
  return undefined;
}
