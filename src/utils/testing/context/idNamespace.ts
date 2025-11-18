import { IdNamespace } from '../../../types.ts';
import { NIL_UUID } from '../../../testUtils.ts';
import { TestContext } from 'vitest';
import { UserSessionOptions } from '../../../types/sessionOptions.ts';
import { v5 } from 'uuid';

export interface UserIdTestContext extends TestContext {
  sessionOptions: Partial<UserSessionOptions> & { userIdNamespace: IdNamespace };
}

export const createTestRunNamespace = (contextName: string): IdNamespace => {
  return v5(contextName, NIL_UUID);
};

export const getTestContextUserIdNamespace = (context: TestContext): IdNamespace => {
  return createTestRunNamespace(context.task.name);
};

const addUserIdNamespaceToContext = (context: UserIdTestContext & TestContext): IdNamespace => {
  const sessionOptions = context.sessionOptions;
  assert(sessionOptions !== undefined, 'Session options are not defined for context');
  if (sessionOptions?.userIdNamespace !== undefined) {
    throw new Error(
      `UserId namespace ${sessionOptions.userIdNamespace} is already set on context for "${context.task.name}"`
    );
  }

  const namespace = getTestContextUserIdNamespace(context);
  sessionOptions.userIdNamespace = namespace;

  return namespace;
};

/**
 * @deprecated Allow userIdNamespace to be set in sessionOptions using setupSessionContext
 */
export const setupUserIdContext = (context: unknown | TestContext, idNamespace?: IdNamespace): UserIdTestContext => {
  const userContext: UserIdTestContext & TestContext = context as unknown as UserIdTestContext & TestContext;
  const sessionOptions = userContext.sessionOptions;

  if (sessionOptions === undefined) {
    userContext.sessionOptions = {
      userIdNamespace: idNamespace || getTestContextUserIdNamespace(userContext),
    };
    return userContext;
  }

  if (idNamespace) {
    sessionOptions.userIdNamespace = idNamespace;
  } else {
    addUserIdNamespaceToContext(userContext);
  }
  return userContext;
};
