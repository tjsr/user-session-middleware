import { IdNamespace } from '../../../types.ts';
import { NIL_UUID } from '../../../testUtils.ts';
import { TaskContext } from 'vitest';
import { UserSessionOptions } from '../../../types/sessionOptions.ts';
import { v5 } from 'uuid';

export interface UserIdTaskContext extends TaskContext {
  sessionOptions: Partial<UserSessionOptions> & { userIdNamespace: IdNamespace };
}

export const createTestRunNamespace = (contextName: string): IdNamespace => {
  return v5(contextName, NIL_UUID);
};

export const getTaskContextUserIdNamespace = (context: TaskContext): IdNamespace => {
  return createTestRunNamespace(context.task.name);
};

const addUserIdNamespaceToContext = (context: UserIdTaskContext & TaskContext): IdNamespace => {
  const sessionOptions = context.sessionOptions;
  assert(sessionOptions !== undefined, 'Session options are not defined for context');
  if (sessionOptions?.userIdNamespace !== undefined) {
    throw new Error(
      `UserId namespace ${sessionOptions.userIdNamespace} is already set on context for "${context.task.name}"`
    );
  }

  const namespace = getTaskContextUserIdNamespace(context);
  sessionOptions.userIdNamespace = namespace;

  return namespace;
};

/**
 * @deprecated Allow userIdNamespace to be set in sessionOptions using setupSessionContext
 */
export const setupUserIdContext = (context: unknown | TaskContext, idNamespace?: IdNamespace): UserIdTaskContext => {
  const userContext: UserIdTaskContext & TaskContext = context as unknown as UserIdTaskContext & TaskContext;
  const sessionOptions = userContext.sessionOptions;

  if (sessionOptions === undefined) {
    userContext.sessionOptions = {
      userIdNamespace: idNamespace || getTaskContextUserIdNamespace(userContext),
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
