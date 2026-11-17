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
  commonEvent: CommonEvent;
}

export interface RequestContext extends AnonymousContext, Actor {}

export type InputParser<Input = unknown> = (commonEvent: CommonEvent) => Input;

type HandlerFunction<Input, Context> = (input: Input, context: Context) => Promise<unknown>;

export interface RouteHandler {
  (input: unknown, context: RequestContext | AnonymousContext): Promise<unknown>;
  access: RouteAccess;
}

function withAccess<Input, Context>(
  access: RouteAccess,
  handlerFunction: HandlerFunction<Input, Context>,
): RouteHandler {
  return Object.assign(handlerFunction as HandlerFunction<unknown, unknown>, { access });
}

export function publicRoute<Input>(
  handlerFunction: HandlerFunction<Input, AnonymousContext>,
): RouteHandler {
  return withAccess({ kind: 'public' }, handlerFunction);
}

export function authenticatedRoute<Input>(
  handlerFunction: HandlerFunction<Input, RequestContext>,
): RouteHandler {
  return withAccess({ kind: 'authenticated' }, handlerFunction);
}

export function protectedRoute<Input>(
  permission: Permission,
  handlerFunction: HandlerFunction<Input, RequestContext>,
): RouteHandler {
  return withAccess({ kind: 'permission', permission }, handlerFunction);
}

export function internalRoute<Input>(
  handlerFunction: HandlerFunction<Input, AnonymousContext>,
): RouteHandler {
  return withAccess({ kind: 'internal' }, handlerFunction);
}

export function readRouteAccess(possibleRouteHandler: unknown): RouteAccess | undefined {
  if (typeof possibleRouteHandler === 'function' && 'access' in possibleRouteHandler) {
    return possibleRouteHandler.access as RouteAccess;
  }
  return undefined;
}
