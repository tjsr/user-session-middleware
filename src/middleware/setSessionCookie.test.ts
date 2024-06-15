import { COOKIE_WITH_HEADER, setSessionCookie } from "./setSessionCookie.js";
import { describe, expect, test } from "vitest";

import { createTestRequestSessionData } from "../testUtils.js";
import express from "express";
import { generateNewSessionId } from "../getSession.js";

export const expectSetSessionCookie = (response: express.Response, sessionID: string) => {
  if (COOKIE_WITH_HEADER) {
    // expect(response.get('Set-Cookie')).toEqual(`sessionId=${sessionID}`);
    expect(response.set).toBeCalledWith('Set-Cookie', `sessionId=${sessionID}; Path=/; HttpOnly; SameSite=Strict`);
  } else {
    expect(response.cookie).toBeCalledWith('sessionId', sessionID, { httpOnly: true, path: '/', strict: true });
  }
};

describe('setSessionCookie', () => {
  test('Should set the session cookie to the session ID.', (context) => {
    const expectedSessionId = generateNewSessionId();
    const { request, response } = createTestRequestSessionData(context,
      { sessionID: expectedSessionId }
    );
    expect(request.session.id).toEqual(expectedSessionId);

    setSessionCookie(request, response);

    expectSetSessionCookie(response, expectedSessionId);
  });
  
  test('Should throw an error if the session has not been created', (context) => {
    const { request, response } = createTestRequestSessionData(context, {},
      { skipCreateSession: true }
    );
    expect(request.session).toBeUndefined();

    expect(() => setSessionCookie(request, response)).toThrowError();
  });

  test('Should throw an error if the session was created but there\'s no session.id', (context) => {
    const { request, response } = createTestRequestSessionData(context, {});
    expect(request.session).not.toBeUndefined();
    expect(request.session.id).toBeUndefined();

    expect(() => setSessionCookie(request, response)).toThrowError();
  });
});

