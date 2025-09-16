import { SessionId, UserId } from '../../types.ts';
import { generateSessionIdForTestName, generateUserIdForTestName } from '@tjsr/testutils';

import { TaskContext } from 'vitest';

/**
 * @deprecated Use setupSessionContext from src/utils/testing/context/session.ts instead
 */
export const generateSessionIdForTest = (context: TaskContext, sessionPrefix?: string): SessionId => {
  return generateSessionIdForTestName(context.task.name, sessionPrefix);
};

export const generateUserIdForTest = (context: TaskContext, userPrefix?: string): UserId => {
  return generateUserIdForTestName(context.task.name, userPrefix);
};
