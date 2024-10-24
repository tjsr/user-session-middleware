import {
  expectDifferentSetCookieSessionId,
  expectResponseResetsSessionIdCookie,
  expectSetCookieSessionId
} from '../../utils/expectations.js';
import { handleSessionCookie, handleSessionCookieOnError } from "./handleSessionCookie.js";

import { HttpStatusCode } from '../../httpStatusCodes.js';
import { SESSION_ID_HEADER_KEY } from '../../getSession.js';
import { appWithMiddleware } from '../../utils/testing/middlewareTestUtils.js';
import { generateNewSessionId } from '../../session/sessionId.js';
import { handleExistingSessionWithNoSessionData } from './handleExistingSessionWithNoSessionData.js';
import {
  handleNewSessionWithNoSessionData
} from "./handleSessionWithNoData.js";
import { handleSessionDataRetrieval } from "./handleSessionDataRetrieval.js";
import { handleSessionIdRequired } from "./handleSessionIdRequired.js";
import supertest from 'supertest';

describe('handler.handleSessionCookie', () => {
  test(
    'Should generate a new session ID if the current session ID given is invalid and set the new value as a cookie.',
    async () => {
      const testTessionId = generateNewSessionId();
      const { app } = appWithMiddleware([
        handleSessionIdRequired,
        handleSessionDataRetrieval,
        handleNewSessionWithNoSessionData,
        handleExistingSessionWithNoSessionData,
        handleSessionCookie,
        handleSessionCookieOnError,
      ]);
      app.use(handleSessionCookieOnError);
      const response = await supertest(app)
        .get('/')
        .set(SESSION_ID_HEADER_KEY, testTessionId)
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(HttpStatusCode.UNAUTHORIZED);
      // TODO: Set checkMultiple when we fix sessionId/connect.sid issue.
      expectResponseResetsSessionIdCookie(response, testTessionId, false);
    });

  test('Should not match sessionId in a cookie string.', () => {
    expectDifferentSetCookieSessionId('a2146a0b-579e-5483-ada6-9d6e1ccfe984',
      'sessionId=d9cac899-f89f-49c7-b945-6ec44e9314c7; Path=/; HttpOnly; SameSite=Strict');
  });

  test('Should match sessionId in a cookie string.', () => {
    expectSetCookieSessionId('d9cac899-f89f-49c7-b945-6ec44e9314c7',
      'sessionId=d9cac899-f89f-49c7-b945-6ec44e9314c7; Path=/; HttpOnly; SameSite=Strict');
  });
});
