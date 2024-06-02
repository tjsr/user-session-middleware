import { SESSION_ID_HEADER_KEY, generateNewSessionId } from "../getSession.js";
import { appWithMiddleware, expectResponseResetsSessionIdCookie } from "../testUtils.js";
import { describe, expect, test } from "vitest";
import {
  handleExistingSessionWithNoSessionData,
  handleNewSessionWithNoSessionData
} from "./handleSessionWithNoData.js";
import { handleSessionCookie, handleSessionCookieOnError } from "./handleSessionCookie.js";

import { handleSessionDataRetrieval } from "./storedSessionData.js";
import { handleSessionIdRequired } from "./handleSessionId.js";
import supertest from 'supertest';

describe('spec.handleSessionCookie', () => {
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
      
      expect(response.status).toBe(401);
      expectResponseResetsSessionIdCookie(response, testTessionId);
    });
});
