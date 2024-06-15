import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EmailAddress } from '../types.js';
import { UserModel } from '../types/model.js';
import { createUserIdFromEmail } from './user.js';
import { getDbUserByEmail } from './getDbUser.js';
import { setRetrieveUserDataFunction } from './getDbUser.js';
import { setUserIdNamespace } from './userNamespace.js';
import { v5 } from 'uuid';

const nilUuid = '00000000-0000-0000-0000-000000000000';

type MockRetrieveUserDataFn = (_email: EmailAddress) => Promise<UserModel>;

const createMockRetrieveUserData = (result: UserModel): MockRetrieveUserDataFn => {
  const mockRetrieveUserData: MockRetrieveUserDataFn = vi.fn<
    [email: string],
    Promise<UserModel>
  >(async (_email: string) => {
    return Promise.resolve(result);
  });
  return mockRetrieveUserData;
};

describe('getDbUserByEmail', () => {
  beforeEach(() => {
    const userIdNamespace = v5('getDbUserByEmail.set', nilUuid);
    setUserIdNamespace(userIdNamespace);

    setRetrieveUserDataFunction(undefined!);
  });
  
  test('Should call retrieveUserData if function is set', async () => {
    const mockRetrieveUserData: MockRetrieveUserDataFn = createMockRetrieveUserData({
      email: 'result@example.com',
      userId: createUserIdFromEmail('test@example.com'),
    });

    setRetrieveUserDataFunction(mockRetrieveUserData);
    const dbUser = await getDbUserByEmail('test@example.com');
    expect(mockRetrieveUserData).toHaveBeenCalledWith('test@example.com');
    expect(dbUser.email).toEqual('result@example.com');
    expect(dbUser.userId).toEqual('a0400ecb-cd13-5d50-b48c-c1b65a4dd7de');
  });

  test('Should return a default user object if retrieveUserData is not set', async () => {
    const defaultIdNamespace = v5('getDbUserByEmail.modified', nilUuid);
    setUserIdNamespace(defaultIdNamespace);

    const dbUser = await getDbUserByEmail('modified@example.com');
    expect(dbUser.email).toEqual('modified@example.com');
    expect(dbUser.userId).toEqual('81aac4df-5274-5417-98ab-edfd41274cab');
  });
});
