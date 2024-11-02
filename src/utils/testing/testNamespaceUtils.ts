import { UserAppTaskContext, UserIdTaskContext } from './types.js';

import { IdNamespace } from '../../types.js';
import { NIL_UUID } from '../../testUtils.js';
import { TaskContext } from 'vitest';
import express from '../../express/index.js';
import { setAppUserIdNamespace } from '../../auth/userNamespace.js';
import { v5 } from 'uuid';

export const createTestRunNamespace = (contextName: string): IdNamespace => {
  return v5(contextName, NIL_UUID);
};

const getTaskContextUserIdNamespace = (context: TaskContext): IdNamespace => {
  return createTestRunNamespace(context.task.name);
};

export const setUserIdNamespaceForTest = (context: UserIdTaskContext): IdNamespace => {
  if (context.userIdNamespace !== undefined) {
    throw new Error(`UserId namespace ${context.userIdNamespace} is already set on context for "${context.task.name}"`);
  }

  const namespace = getTaskContextUserIdNamespace(context);
  context.userIdNamespace = namespace;
  return context.userIdNamespace;

  // if (context.app === undefined) {
  //   throw new DeprecatedFunctionError('setUserIdNamespaceForTest', context.task.name);
  // }

  // const userIdNamespace: IdNamespace = v5(context.task.name, NIL_UUID);
  // return setUserIdNamespace(userIdNamespace);
};

export const setUserIdNamespaceOnTestApp = (context: UserAppTaskContext, app: express.Application): IdNamespace => {
  const userIdNamespace: IdNamespace = v5(context.task.name, NIL_UUID);
  return setAppUserIdNamespace(app, userIdNamespace);
};
