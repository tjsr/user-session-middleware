import { ApiTestContext, setupApiTest } from './utils/testcontext.js';
import { beforeEach, describe, expect, test } from 'vitest';

import { HttpStatusCode } from '../httpStatusCodes.js';
import { SESSION_ID_HEADER_KEY } from '../getSession.js';
import { SessionId } from '../types.js';
import { getStoreSessionAsPromise } from './utils/sessionStoreUtils.js';
import { getSupertestSessionIdCookie } from '../utils/testing/cookieTestUtils.js';
import { loginWith } from '../utils/testing/apiTestUtils.js';
import supertest from 'supertest';
import { testableApp } from '../utils/testing/middlewareTestUtils.js';

describe('session', () => {
  test.todo('Should generate a new session ID if no existing one is given.', () => {
  
  });

  test.todo('Should generate and return a new connect.sid when an existing one is provided.', () => {

  });

  test.todo('Should generate and return a new X-sesison-id when an existing one is provided.', () => {

  });
}); 

describe('api.session', () => {
  // A new session ID should be generated for any authentication event
  beforeEach((context: ApiTestContext) => setupApiTest(context));

  test.todo('Should generate a sessionId for a connection that provides no existing session ID.', () => {

  });

  test.todo('Should regenerate a new sessionId for a connection that provides an existing session ID.', () => {

  });

  const refreshSession = async (context: ApiTestContext, sessionId?: SessionId) => {
    if (!context.app) {
      context.app = testableApp(context.sessionOptions);
    }

    let st = supertest(context.app).get('/session');

    st.set('Content-Type', 'application/json')
      .accept('application/json');
  
    if (sessionId) {
      st = st.set(SESSION_ID_HEADER_KEY, sessionId);
    } else if (context.currentSessionId) {
      st = st.set(SESSION_ID_HEADER_KEY, context.currentSessionId);
    }
    const response = await st;
    context.currentSessionId = getSupertestSessionIdCookie(response);

    return response;
  };

  test('Should return a 401 if a request uses that a session that was regenerated.',
    async (context: ApiTestContext) => {
      console.log('First call - login.');
      const loginResponse = await loginWith(context, 'test@example.com');
      expect(loginResponse.statusCode).toEqual(HttpStatusCode.OK);
      expect(context.currentSessionId).not.toBeUndefined();
      const loginSessionId: SessionId|undefined = context.currentSessionId;
      const loginSessionDataFromStore = await getStoreSessionAsPromise(context.sessionOptions.store!, loginSessionId!);
      expect(loginSessionDataFromStore).toBeDefined();

      console.log('Second call - refresh.');
      const refreshResponse = await refreshSession(context);
      expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);
      expect(context.currentSessionId).not.toBeUndefined();
      const refreshedSessionId: SessionId|undefined = context.currentSessionId;

      expect(loginSessionId).not.toEqual(refreshedSessionId);

      const refreshSessionData = await getStoreSessionAsPromise(context.sessionOptions.store!, refreshedSessionId!);
      expect(refreshSessionData).toBeDefined();

      const loginSessionDataUpdated = await getStoreSessionAsPromise(context.sessionOptions.store!, loginSessionId!);
      expect(loginSessionDataUpdated).toBeUndefined();

      console.log('Third call - refresh.');
      const secondRefreshResponse = await refreshSession(context, loginSessionId);
      expect(secondRefreshResponse.statusCode).toEqual(HttpStatusCode.UNAUTHORIZED);
    });
});
