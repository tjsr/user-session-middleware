import { ApiTestContext, WithSessionTestContext, setupApiTest } from './utils/testcontext.js';

import { HttpStatusCode } from '../httpStatusCodes.js';
import { SessionId } from '../types.js';
import { TaskContext } from 'vitest';
import { generateSessionIdForTest } from '@tjsr/testutils';
import { getStoreSessionAsPromise } from './utils/sessionStoreUtils.js';
import { loginWith } from '../utils/testing/apiTestUtils.js';
import { refreshSession } from './utils/testcontext.js';

describe<WithSessionTestContext>('api.session', () => {
  // A new session ID should be generated for any authentication event
  beforeEach((context: ApiTestContext) => {
    setupApiTest(context);
    generateSessionIdForTest(context);
  });

  test<
    ApiTestContext & WithSessionTestContext
  >('Should generate a sessionId for a connection that provides no existing session ID.', async (context) => {
    const taskContext: TaskContext = context as TaskContext;
    const sessionId = generateSessionIdForTest(taskContext);
    const refreshResponse = await refreshSession(context, sessionId);
    expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);
    const firstSessionId: SessionId | undefined = context.currentSessionId;
    expect(firstSessionId).not.toBeUndefined();
  });

  const verifyUpdatedSessionId = async (
    context: ApiTestContext & WithSessionTestContext,
    previousSessionId: SessionId
  ) => {
    const sessionResponse = await refreshSession(context, context.currentSessionId);
    expect(sessionResponse.statusCode).toEqual(HttpStatusCode.OK);
    const updatedSessionId: SessionId | undefined = context.currentSessionId;
    const sessionIdFromBody = sessionResponse.body.sessionId;
    expect(updatedSessionId).not.toEqual(previousSessionId);
    expect(updatedSessionId).not.toBeUndefined();
    expect(sessionIdFromBody).toEqual(updatedSessionId);
    return updatedSessionId;
  };

  test<
    ApiTestContext & TaskContext & WithSessionTestContext
  >('Should regenerate a new sessionId for a connection that provides an existing session ID.', async (context) => {
    const refreshResponse = await refreshSession(context, context.currentSessionId);
    expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);
    const firstSessionId: SessionId | undefined = context.currentSessionId;

    const secondRefreshResponse = await refreshSession(context, firstSessionId);
    expect(secondRefreshResponse.statusCode).toEqual(HttpStatusCode.OK);
    const secondSessionId: SessionId | undefined = context.currentSessionId;
    expect(secondSessionId).not.toBeUndefined();
    expect(secondSessionId).not.toEqual(firstSessionId);

    let updatedSessionId = await verifyUpdatedSessionId(context, secondSessionId!);
    updatedSessionId = await verifyUpdatedSessionId(context, updatedSessionId!);
    updatedSessionId = await verifyUpdatedSessionId(context, updatedSessionId!);
    updatedSessionId = await verifyUpdatedSessionId(context, updatedSessionId!);
    expect(updatedSessionId).not.toBeUndefined();
    expect(updatedSessionId).not.toEqual(firstSessionId);
  });

  test('Should expect a session to be removed from the store when regenerated.', async (context: ApiTestContext) => {
    const loginResponse = await loginWith(context, 'test@example.com');
    expect(loginResponse.statusCode).toEqual(HttpStatusCode.OK);
    const loginSessionId: SessionId | undefined = context.currentSessionId;
    let loginSessionDataFromStore = await getStoreSessionAsPromise(context.sessionOptions.store!, loginSessionId!);
    expect(loginSessionDataFromStore).toBeDefined();

    const refreshResponse = await refreshSession(context);
    expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);

    loginSessionDataFromStore = await getStoreSessionAsPromise(context.sessionOptions.store!, loginSessionId!);
    expect(loginSessionDataFromStore).toBeUndefined();
  });

  test('Should return a 401 if a request uses that a session that was regenerated.', async (context: ApiTestContext) => {
    const loginResponse = await loginWith(context, 'test@example.com');
    expect(loginResponse.statusCode).toEqual(HttpStatusCode.OK);
    expect(context.currentSessionId).not.toBeUndefined();
    const loginSessionId: SessionId | undefined = context.currentSessionId;
    const loginSessionDataFromStore = await getStoreSessionAsPromise(context.sessionOptions.store!, loginSessionId!);
    expect(loginSessionDataFromStore).toBeDefined();

    const refreshResponse = await refreshSession(context);
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
  });
});
