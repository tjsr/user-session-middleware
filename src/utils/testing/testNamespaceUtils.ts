import { IdNamespace, Provides } from '../../types.js';
import { UserAppTaskContext, UserIdTaskContext } from '../../api/utils/testcontext.js';

import { AppLocals } from '../../express/index.js';
import { NIL_UUID } from '../../testUtils.js';
import { TaskContext } from 'vitest';
import { setAppUserIdNamespace } from '../../auth/userNamespace.js';
import { v5 } from 'uuid';

export const createTestRunNamespace = (contextName: string): IdNamespace => {
  return v5(contextName, NIL_UUID);
};

const getTaskContextUserIdNamespace = (context: TaskContext): IdNamespace => {
  return createTestRunNamespace(context.task.name);
};

export const addUserIdNamespaceToContext = (context: Provides<UserIdTaskContext, 'userIdNamespace'>): IdNamespace => {
  const outputContext: UserIdTaskContext = context as UserIdTaskContext;

  if (outputContext.userIdNamespace !== undefined) {
    throw new Error(
      `UserId namespace ${outputContext.userIdNamespace} is already set on context for "${context.task.name}"`
    );
  }

  const namespace = getTaskContextUserIdNamespace(context);
  outputContext.userIdNamespace = namespace;
  return namespace;
};

export const setUserIdNamespaceOnTestApp = (context: UserAppTaskContext, appLocals: AppLocals): IdNamespace => {
  const userIdNamespace: IdNamespace = v5(context.task.name, NIL_UUID);
  return setAppUserIdNamespace(appLocals, userIdNamespace);
};
