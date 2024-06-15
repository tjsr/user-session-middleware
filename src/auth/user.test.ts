import { beforeEach, describe, expect, test } from 'vitest';

import { EmailAddress } from '../types.js';
import { createUserIdFromEmail } from './user.js';
import { setUserIdNamespace } from './userNamespace.js';
import { v5 } from 'uuid';

const nilUuid = '00000000-0000-0000-0000-000000000000';

describe('createUserIdFromEmail', () => {
  const initialEnvNamespace = v5('createUserIdFromEmail.env', nilUuid);
  beforeEach(() => {
    process.env['USERID_UUID_NAMESPACE'] = initialEnvNamespace;
    setUserIdNamespace(undefined!);
  });

  test('Should create a uuid5 applicable to the env namespace for an email address.', () => {
    const testValues = {
      'alternate@example.com': '92b8d605-3168-52fc-9da2-b8974b64de2d',
      'test@example.com': 'be45fac6-b38b-595b-b04f-68ff68bae447',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    Object.keys(testValues).forEach((email) => {
      const testUserId = createUserIdFromEmail(email as EmailAddress);
      expect(testUserId, `Failed matching ${email}`).toEqual(testValues[email]);
    });
  });

  test('Should create a uuid5 applicable to the provided namespace for an email address.', () => {
    const changedNamespace = v5('createUserIdFromEmail.alternate', nilUuid);
    setUserIdNamespace(changedNamespace);
    const testValues = {
      'alternate@example.com': '87f01eb8-ee54-55c3-8763-a589ab82e5d0',
      'test@example.com': '4c63c2e9-1aab-5c03-9027-5af3405dc410',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    Object.keys(testValues).forEach((email) => {
      const testUserId = createUserIdFromEmail(email as EmailAddress);
      expect(testUserId, `Failed matching ${email}`).toEqual(testValues[email]);
    });
  });
});
