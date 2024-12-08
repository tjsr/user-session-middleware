import { SESSION_ID_COOKIE, getUserSessionMiddlewareOptions } from '../../../getSession.js';

import { MemoryStore } from '../../../express-session/index.js';
import { SessionId } from '../../../types.js';
import { TaskContext } from 'vitest';
import { UserSessionData } from '../../../types/session.js';
import { UserSessionOptions } from '../../../types/sessionOptions.js';
import { generateSessionIdForTestName } from '@tjsr/testutils';
import { getTaskContextUserIdNamespace } from './idNamespace.js';

export type SessionTestContext = TaskContext & {
  currentSessionId?: SessionId;
  sessionOptions: UserSessionOptions;
};

export type WithSessionTestContext = Omit<SessionTestContext, 'currentSessionId'> & { currentSessionId: SessionId };
export type NoSessionTestContext = Omit<SessionTestContext, 'currentSessionId'> & { currentSessionId: never };

export type SessionDataTaskContext = SessionTestContext & {
  sessionData: Map<string, UserSessionData>;
};

const booleanFallThrough = (defaultValue: boolean, ...values: (boolean | undefined)[]): boolean | undefined => {
  for (const value of values) {
    if (value === null) {
      return undefined;
    }
    if (value !== undefined) {
      return value;
    }
  }
  return defaultValue;
};

const addSessionOptionsToContext = (
  context: SessionTestContext,
  options?: Partial<UserSessionOptions>
): UserSessionOptions => {
  if (context.sessionOptions === undefined) {
    context.sessionOptions = {} as UserSessionOptions;
  }
  if (context.sessionOptions.name === undefined) {
    context.sessionOptions.name = options?.name || SESSION_ID_COOKIE;
  }
  if (context.sessionOptions.secret === undefined) {
    context.sessionOptions.secret = options?.secret || 'test-secret';
  }
  context.sessionOptions.store = options?.store || context.sessionOptions?.store || new MemoryStore();
  context.sessionOptions.saveUninitialized = booleanFallThrough(
    true,
    options?.saveUninitialized,
    context.sessionOptions.saveUninitialized
  );
  context.sessionOptions.resave = booleanFallThrough(true, options?.resave, context.sessionOptions.resave);
  context.sessionOptions.cookie = options?.cookie || context.sessionOptions.cookie;
  context.sessionOptions.rolling = booleanFallThrough(false, options?.rolling, context.sessionOptions.rolling);
  context.sessionOptions.userIdNamespace =
    options?.userIdNamespace || context.sessionOptions.userIdNamespace || getTaskContextUserIdNamespace(context);
  context.sessionOptions.debugSessionOptions = booleanFallThrough(
    false,
    options?.debugSessionOptions,
    context.sessionOptions.debugSessionOptions
  );
  context.sessionOptions.debugCallHandlers = booleanFallThrough(
    false,
    options?.debugCallHandlers,
    context.sessionOptions.debugCallHandlers
  );
  context.sessionOptions.loginPath = options?.loginPath || context.sessionOptions.loginPath;
  context.sessionOptions.logoutPath = options?.logoutPath || context.sessionOptions.logoutPath;
  context.sessionOptions.sessionPath = options?.sessionPath || context.sessionOptions.sessionPath;

  return getUserSessionMiddlewareOptions(context.sessionOptions);
};

export const setupSessionContext = (
  context: TaskContext,
  options?: Partial<UserSessionOptions> | null
): SessionTestContext => {
  const sessionContext: SessionTestContext = context as unknown as SessionTestContext;

  sessionContext.currentSessionId = generateSessionIdForTestName(context.task.name);
  if (options !== null) {
    addSessionOptionsToContext(sessionContext, options || {});
  }

  return sessionContext;
};
