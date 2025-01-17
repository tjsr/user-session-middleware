import { SessionTestContext, setupSessionContext } from '../utils/testing/context/session.js';
import { getSignedCookieValue, setRequestSessionCookie } from './setSessionCookie.js';

import { SESSION_SECRET } from '../getSession.js';
import { SessionEnabledRequestContext } from '../utils/testing/context/request.js';
import { SessionId } from '../types.js';
import { TaskContext } from 'vitest';
import { createTestRequestSessionData } from '../testUtils.js';
import { expectSetSessionCookieOnResponseMock } from '../utils/testing/cookieTestUtils.js';
import { setupExpressContext } from '../utils/testing/context/appLocals.js';

describe('setSessionCookie', () => {
  beforeEach((context: TaskContext) => {
    const sessionContext: SessionTestContext = setupSessionContext(context, { secret: SESSION_SECRET });
    setupExpressContext(sessionContext);
  });
  test('Should set the session cookie to the session ID.', (context: SessionEnabledRequestContext) => {
    const expectedSessionId: SessionId = context.currentSessionId;

    // const { request } = setupRequestContext(context, { sessionID: expectedSessionId });
    // const { response } = setupResponseContext(context);
    const { request, response } = createTestRequestSessionData(context, { sessionID: expectedSessionId });

    // const { request, response } = createTestRequestSessionData(context, { sessionID: expectedSessionId });
    expect(request.session.id).toEqual(expectedSessionId);
    expect(request.app).not.toBeUndefined();
    expect(request.app.locals['sessionOptions'].secret).toEqual(SESSION_SECRET);
    setRequestSessionCookie(request, response);
    const secret = SESSION_SECRET;

    const expectedCookieValue = getSignedCookieValue(expectedSessionId, secret);
    expectSetSessionCookieOnResponseMock(response, expectedCookieValue, context.sessionOptions.name!);
  });

  test('Should throw an error if the session has not been created', (context: SessionEnabledRequestContext) => {
    const { request, response } = createTestRequestSessionData(context, {}, { skipCreateSession: true });
    expect(request.session).toBeUndefined();

    expect(() => setRequestSessionCookie(request, response)).toThrowError();
  });

  test("Should throw an error if the session was created but there's no session.id", (context: SessionEnabledRequestContext) => {
    const { request, response } = createTestRequestSessionData(context, {});
    expect(request.session).not.toBeUndefined();
    expect(request.session.id).toBeUndefined();

    expect(() => setRequestSessionCookie(request, response)).toThrowError();
  });
});
