import { SessionId, UserId } from '../../types.ts';
import { generateSessionIdForTestName, generateUserIdForTestName } from '@tjsr/testutils';

import { TestContext } from 'vitest';

/**
 * @deprecated Use setupSessionContext from src/utils/testing/context/session.ts instead
 */
export const generateSessionIdForTest = (context: TestContext, sessionPrefix?: string): SessionId => {
  return generateSessionIdForTestName(context.task.name, sessionPrefix);
};

export const generateUserIdForTest = (context: TestContext, userPrefix?: string): UserId => {
  return generateUserIdForTestName(context.task.name, userPrefix);
};
