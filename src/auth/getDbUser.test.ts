import { TaskContext } from 'vitest';
import { UserIdTaskContext } from '../utils/testing/context/idNamespace.js';
import { createUserIdFromEmail } from './user.js';
import { getDbUserByEmail } from './getDbUser.js';
import { setLoginUserLookupWithContextUserData } from '../utils/testing/apiTestUtils.js';
import { setRetrieveUserDataFunction } from './getDbUser.js';
import { setupSessionContext } from '../utils/testing/context/session.js';

describe('getDbUserByEmail', () => {
  beforeEach<UserIdTaskContext>((context: UserIdTaskContext & TaskContext) => {
    setupSessionContext(context);
    setRetrieveUserDataFunction(undefined!);
  });

  test<UserIdTaskContext>('Should call retrieveUserData if function is set', async (context) => {
    const userDataMap: Map<string, unknown> = new Map();
    userDataMap.set('test@example.com', {
      email: 'test@example.com',
      userId: createUserIdFromEmail(context.sessionOptions.userIdNamespace, 'test@example.com'), // was test@
    });
    setLoginUserLookupWithContextUserData(userDataMap);

    const dbUser = await getDbUserByEmail(context.sessionOptions.userIdNamespace, 'test@example.com');
    expect(dbUser.email).toEqual('test@example.com');
    expect(dbUser.userId).toEqual('159cb6c5-6456-5496-831f-91c107591c68');
  });

  test<UserIdTaskContext>('Should return a default user object if retrieveUserData is not set', async (context) => {
    const dbUser = await getDbUserByEmail(context.sessionOptions.userIdNamespace, 'modified@example.com');
    expect(dbUser.email).toEqual('modified@example.com');
    expect(dbUser.userId).toEqual('155763ee-a5cf-5514-b7b6-88709dd198b5');
  });
});
