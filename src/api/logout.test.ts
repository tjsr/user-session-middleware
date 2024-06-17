import {
  NIL_UUID,
  SessionDataTestContext,
  createContextForSessionTest,
  createTestRequestSessionData,
} from '../testUtils.js';
import { beforeEach, describe, expect, test } from 'vitest';

import { createUserIdFromEmail } from '../auth/user.js';
import { logout } from './logout.js';
import { setUserIdNamespace } from '../auth/userNamespace.js';
import { v5 } from 'uuid';

describe('logout', () => {
  const TEST_USER_EMAIL = 'test@example.com';
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test.todo('Should return a 403 when a user is not currently logged in.', async (context: SessionDataTestContext) => {
    const TEST_UUID_NAMESPACE = v5('logout.200ok', NIL_UUID);
    setUserIdNamespace(TEST_UUID_NAMESPACE);
    const { next, request, response, spies } = createTestRequestSessionData(context, {
      sessionID: 'test-session-id',
    }, {
      overrideSessionData: {
        email: undefined,
        userId: undefined,
      },
      spyOnSave: true,
    });

    expect(request.session).toBeDefined();
    const saveMock = spies?.get(request.session.save);
    
    await logout(request, response, next);
    expect(saveMock).not.toHaveBeenCalled();
    expect(response.status).not.toHaveBeenCalledWith(200);
    expect(next).toHaveBeenCalledWith();

  });

  test('Should call session.save with a HTTP 200 result if we currently have a user.',
    async (context: SessionDataTestContext) => {
      const TEST_UUID_NAMESPACE = v5('logout.200ok', NIL_UUID);
      setUserIdNamespace(TEST_UUID_NAMESPACE);
      const { next, request, response, spies } = createTestRequestSessionData(context, {
        sessionID: 'test-session-id',
      }, {
        overrideSessionData: {
          email: TEST_USER_EMAIL,
          userId: createUserIdFromEmail(TEST_USER_EMAIL),
        },
        spyOnSave: true,
      });

      expect(request.session).toBeDefined();
      const saveMock = spies?.get(request.session.save);
      
      await logout(request, response, next);
      expect(saveMock).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(200);
      expect(next).toHaveBeenCalledWith();
    });
}); 

