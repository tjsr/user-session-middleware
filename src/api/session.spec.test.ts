import { ApiTestContext, setupApiTest } from './utils/testcontext.ts';
import { NoSessionTestContext, WithSessionTestContext } from '../utils/testing/context/session.ts';

import { HttpStatusCode } from '../httpStatusCodes.ts';
import { SessionData } from '../express-session/index.ts';
import { SessionId } from '../types.ts';
import { TestContext } from 'vitest';
import { addDataToSessionStore } from '../testUtils.ts';
import { getStoreSessionAsPromise } from './utils/sessionStoreUtils.ts';
import { loginWithContext } from '../utils/testing/apiTestUtils.ts';
import { refreshSession } from './utils/refreshSession.ts';

describe<WithSessionTestContext>('api.session', () => {
  // A new session ID should be generated for any authentication event
  beforeEach((context: ApiTestContext<NoSessionTestContext> & TestContext) => {
    setupApiTest(context);
  });

  test<
    ApiTestContext<WithSessionTestContext>
  >('Should generate a sessionId for a connection that provides no existing session ID.', async (context) => {
    context.currentSessionId = undefined!;
    const refreshResponse = await refreshSession(context, undefined!);
    expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);
    const firstSessionId: SessionId | undefined = context.currentSessionId;
    expect(firstSessionId).not.toBeUndefined();
  });

  const verifyUpdatedSessionId = async (
    context: ApiTestContext & WithSessionTestContext,
    previousSessionId: SessionId
  ) => {
    const sessionResponse = await refreshSession(context, context.currentSessionId);
    expect(
      sessionResponse.statusCode,
      `Status code ${sessionResponse.statusCode} did not match expecting 200 when config options are ${JSON.stringify(context.sessionOptions)}`
    ).toEqual(HttpStatusCode.OK);
    const updatedSessionId: SessionId | undefined = context.currentSessionId;
    const sessionIdFromBody = sessionResponse.body.sessionId;
    expect(updatedSessionId).not.toEqual(previousSessionId);
    expect(updatedSessionId).not.toBeUndefined();
    expect(sessionIdFromBody).toEqual(updatedSessionId);
    return updatedSessionId;
  };

  test<
    ApiTestContext<WithSessionTestContext & TestContext>
  >('Should regenerate a new sessionId for a connection that provides an existing session ID.', async (context) => {
    const sessionData: Partial<SessionData> = {};
    await addDataToSessionStore(context, sessionData);
    const refreshResponse = await refreshSession(context, context.currentSessionId);
    expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);
    const firstSessionId: SessionId = context.currentSessionId;

    const secondRefreshResponse = await refreshSession(context, firstSessionId);
    expect(secondRefreshResponse.statusCode).toEqual(HttpStatusCode.OK);
    const secondSessionId: SessionId = context.currentSessionId;
    expect(secondSessionId).not.toBeUndefined();
    expect(secondSessionId).not.toEqual(firstSessionId);

    let updatedSessionId = await verifyUpdatedSessionId(context, secondSessionId!);
    updatedSessionId = await verifyUpdatedSessionId(context, updatedSessionId!);
    updatedSessionId = await verifyUpdatedSessionId(context, updatedSessionId!);
    updatedSessionId = await verifyUpdatedSessionId(context, updatedSessionId!);
    expect(updatedSessionId).not.toBeUndefined();
    expect(updatedSessionId).not.toEqual(firstSessionId);
  });

  test('Should expect a session to be removed from the store when regenerated.', async (context: ApiTestContext<WithSessionTestContext>) => {
    const loginResponse = await loginWithContext(context, 'test@example.com');
    expect(loginResponse.statusCode).toEqual(HttpStatusCode.OK);
    const loginSessionId: SessionId | undefined = context.currentSessionId;
    let loginSessionDataFromStore = await getStoreSessionAsPromise(context.sessionOptions.store!, loginSessionId!);
    expect(loginSessionDataFromStore).toBeDefined();

    const refreshResponse = await refreshSession(context, context.currentSessionId);
    expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);

    loginSessionDataFromStore = await getStoreSessionAsPromise(context.sessionOptions.store!, loginSessionId!);
    expect(loginSessionDataFromStore).toBeUndefined();
  });

  test.fails(
    'Should return a 401 if a request uses that a session that was regenerated.',
    async (context: ApiTestContext<WithSessionTestContext>) => {
      const loginResponse = await loginWithContext(context, 'test@example.com');
      expect(loginResponse.statusCode).toEqual(HttpStatusCode.OK);
      expect(context.currentSessionId).not.toBeUndefined();
      const loginSessionId: SessionId | undefined = context.currentSessionId;
      const loginSessionDataFromStore = await getStoreSessionAsPromise(context.sessionOptions.store!, loginSessionId!);
      expect(loginSessionDataFromStore).toBeDefined();

      const refreshResponse = await refreshSession(context, context.currentSessionId);
      expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);
      expect(context.currentSessionId).not.toBeUndefined();
      const refreshedSessionId: SessionId | undefined = context.currentSessionId;

      expect(loginSessionId).not.toEqual(refreshedSessionId);

      const refreshSessionData = await getStoreSessionAsPromise(context.sessionOptions.store!, refreshedSessionId!);
      expect(refreshSessionData).toBeDefined();

      const loginSessionDataUpdated = await getStoreSessionAsPromise(context.sessionOptions.store!, loginSessionId!);
      expect(loginSessionDataUpdated).toBeUndefined();

      const secondRefreshResponse = await refreshSession(context, loginSessionId);
      expect(secondRefreshResponse.statusCode).toEqual(HttpStatusCode.UNAUTHORIZED);
    }
  );
});
