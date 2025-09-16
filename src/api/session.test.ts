import { ResponseContext, setupResponseContext } from '../utils/testing/context/response.ts';
import { SessionEnabledRequestContext, setupRequestContext } from '../utils/testing/context/request.ts';
import { SessionTestContext, setupSessionContext } from '../utils/testing/context/session.ts';

import { SystemHttpRequestType } from '../types/request.ts';
import { TaskContext } from 'vitest';
import { UserAppTaskContext } from './utils/testcontext.ts';
import { session } from './session.ts';
import { setupExpressContext } from '../utils/testing/context/appLocals.ts';

describe('session', () => {
  // test.todo('Should generate a new session ID if no existing one is given.', () => {
  //   describe<ApiTestContext<NoSessionTestContext> & TaskContext>('api.nosession.logout', () => {
  beforeEach((context: TaskContext) => {
    const sessionCtx: SessionTestContext = setupSessionContext(context);
    const appContext: UserAppTaskContext = setupExpressContext(sessionCtx);
    setupRequestContext(appContext);
    setupResponseContext(appContext);
  });

  test<
    SessionEnabledRequestContext<SystemHttpRequestType> & ResponseContext
  >('Should return a 401 when a user is not currently logged in.', async (context) => {
    const req = context.request;
    const resp = context.response;
    const next = vitest.fn();

    session(req, resp, next);
    // const refreshResponse = await beginSession(context);
    // expect(refreshResponse.statusCode).toEqual(HttpStatusCode.OK);
    // const logoutResponse = await logoutFrom(context);
    // expect(logoutResponse.statusCode).toEqual(HttpStatusCode.UNAUTHORIZED);
  });

  test.todo('Should destroy an existing session when calling session endpoint.', () => {});
});
