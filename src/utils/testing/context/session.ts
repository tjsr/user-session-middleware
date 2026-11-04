import { generateSessionIdForTestName } from '@tjsr/testutils';
import { TestContext } from 'vitest';

import { getTestContextUserIdNamespace } from './idNamespace.ts';
import { MemoryStore } from '../../../express-session/index.ts';
import { SESSION_ID_COOKIE, getUserSessionMiddlewareOptions } from '../../../getSession.ts';
import { requireStringSessionSecret } from '../../../middleware/setSessionCookie.ts';
import { UserSessionData } from '../../../types/session.ts';
import { UserSessionOptions } from '../../../types/sessionOptions.ts';
import { SessionId } from '../../../types.ts';

export type TestSessionOptions = UserSessionOptions & { secret: string | string[] };

export type SessionTestContext = TestContext & {
  currentSessionId?: SessionId;
  sessionOptions: TestSessionOptions;
};

export type WithSessionTestContext = Omit<SessionTestContext, 'currentSessionId'> & { currentSessionId: SessionId };
export type NoSessionTestContext = Omit<SessionTestContext, 'currentSessionId'> & { currentSessionId: never };

export type SessionDataTestContext = SessionTestContext & {
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
    context.sessionOptions = { secret: 'test-secret', userIdNamespace: getTestContextUserIdNamespace(context) };
  }
  if (context.sessionOptions.name === undefined) {
    context.sessionOptions.name = options?.name || SESSION_ID_COOKIE;
  }
  if (options?.secret !== undefined || context.sessionOptions.secret === undefined) {
    context.sessionOptions.secret = requireStringSessionSecret(options?.secret || 'test-secret');
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
    options?.userIdNamespace || context.sessionOptions.userIdNamespace || getTestContextUserIdNamespace(context);
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
  context: TestContext,
  options?: Partial<UserSessionOptions> | null
): SessionTestContext => {
  const sessionContext: SessionTestContext = context as unknown as SessionTestContext;

  sessionContext.currentSessionId = generateSessionIdForTestName(context.task.name);
  if (options !== null) {
    addSessionOptionsToContext(sessionContext, options || {});
  }

  return sessionContext;
};
