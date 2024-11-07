import { CookieOptions } from 'express';
import { createTestRequestSessionData } from '../testUtils.js';
import { expectSetSessionCookieOnResponseMock } from '@tjsr/testutils';
import { generateNewSessionId } from '../session/sessionId.js';
import { setSessionCookie } from './setSessionCookie.js';

describe('setSessionCookie', () => {
  test('Should set the session cookie to the session ID.', (context) => {
    const expectedSessionId = generateNewSessionId();
    const { request, response } = createTestRequestSessionData(context, { sessionID: expectedSessionId });
    expect(request.session.id).toEqual(expectedSessionId);

    setSessionCookie(request, response);

    const expectedCookieOptions: Partial<CookieOptions> = {
      sameSite: 'strict',
    };
    expectSetSessionCookieOnResponseMock('test.sid', response, expectedSessionId, expectedCookieOptions);
  });

  test('Should throw an error if the session has not been created', (context) => {
    const { request, response } = createTestRequestSessionData(context, {}, { skipCreateSession: true });
    expect(request.session).toBeUndefined();

    expect(() => setSessionCookie(request, response)).toThrowError();
  });

  test("Should throw an error if the session was created but there's no session.id", (context) => {
    const { request, response } = createTestRequestSessionData(context, {});
    expect(request.session).not.toBeUndefined();
    expect(request.session.id).toBeUndefined();

    expect(() => setSessionCookie(request, response)).toThrowError();
  });
});
