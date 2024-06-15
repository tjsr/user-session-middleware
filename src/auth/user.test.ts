import { describe, test } from 'vitest';

import { EmailAddress } from '../types.js';
import { createUserIdFromEmail } from './user.js';
import { setUserIdNamespace } from './userNamespace.js';

describe('createUserIdFromEmail', () => {
  test.todo('Should create a uuid5 applicable to the provided namespace for an email address.', () => {
    const testEmail: EmailAddress = 'test@example.com';
    const testNamespace = 'xxx';
    setUserIdNamespace(testNamespace);
    const testUserId = createUserIdFromEmail(testEmail);
  });
});
