import { getSignedCookieValue, setRequestSessionCookie } from './setSessionCookie.js';

import { SESSION_SECRET } from '../getSession.js';
import { createTestRequestSessionData } from '../testUtils.js';
import { expectSetSessionCookieOnResponseMock } from '../utils/testing/cookieTestUtils.js';
import { generateNewSessionId } from '../session/sessionId.js';

describe('setSessionCookie', () => {
  test('Should set the session cookie to the session ID.', (context) => {
    const expectedSessionId = generateNewSessionId();
    const { request, response } = createTestRequestSessionData(context, { sessionID: expectedSessionId });
    expect(request.session.id).toEqual(expectedSessionId);

    setRequestSessionCookie(request, response);

    const expectedCookieValue = getSignedCookieValue(expectedSessionId, SESSION_SECRET);
    expectSetSessionCookieOnResponseMock(response, expectedCookieValue);
  });

  test('Should throw an error if the session has not been created', (context) => {
    const { request, response } = createTestRequestSessionData(context, {}, { skipCreateSession: true });
    expect(request.session).toBeUndefined();

    expect(() => setRequestSessionCookie(request, response)).toThrowError();
  });

  test("Should throw an error if the session was created but there's no session.id", (context) => {
    const { request, response } = createTestRequestSessionData(context, {});
    expect(request.session).not.toBeUndefined();
    expect(request.session.id).toBeUndefined();

    expect(() => setRequestSessionCookie(request, response)).toThrowError();
  });
});
