import { beforeEach, describe, expect, test } from "vitest";
import { handleSessionCookie, handleSessionCookieOnError } from "./handleSessionCookie.ts";
import session, { Cookie } from "express-session";
import { verifyHandlerFunctionCallsNext, verifyHandlerFunctionCallsNextWithError } from "../middlewareTestUtils";

import { SESSION_ID_HEADER_KEY } from "../getSession";
import { appWithMiddleware } from "../testUtils";
import express from "express";
import { handleSessionIdRequired } from "./handleSessionId";
import supertest from 'supertest';

describe('handler.handleSessionIdRequired', () => {
  test('Should fail when no sessionID is provided.', () => 
    verifyHandlerFunctionCallsNextWithError(handleSessionIdRequired, { sessionID: undefined }));

  test('Should fail when no sessionID is provided.', () => 
    verifyHandlerFunctionCallsNext(handleSessionIdRequired, { sessionID: 'test-session-id' }));
});

describe('api.handleSessionIdRequired', () => {
  let app: express.Express;
  let memoryStore: session.MemoryStore;

  beforeEach(() => {
    ({ app, memoryStore } = appWithMiddleware([
      handleSessionIdRequired,
      handleSessionCookie,
      handleSessionCookieOnError,
    ]));
  });

  test('Should accept a request with a valid sessionId.', async () => {
    memoryStore.set('abcd-1234', {
      cookie: new Cookie(),
    });

    const response = await supertest(app)
      .get('/')
      .set(SESSION_ID_HEADER_KEY, 'abcd-1234')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
  });

  test('Should not fail because no sessionId was provided.', async () => {
    // We don't expect an error here because the session generator will assign a new session ID.
    const response = await supertest(app)
      .get('/')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
  });
});
