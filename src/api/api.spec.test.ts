import { ApiTestContext, setupApiTest } from './utils/testcontext.js';
import { NoSessionTestContext, WithSessionTestContext } from '../utils/testing/context/session.js';

import { HttpStatusCode } from '../httpStatusCodes.js';
import { TaskContext } from 'vitest';
import { UserSessionOptions } from '../types/sessionOptions.js';
import { addDataToSessionStore } from '../testUtils.js';
import { loginWithContext } from '../utils/testing/apiTestUtils.js';
import { setupSupertestContext } from '../utils/testing/supertestUtils.js';

describe('api.endpoints', () => {
  const withApi = async <
    ContextType extends TaskContext,
    SessionType extends WithSessionTestContext | NoSessionTestContext,
  >(
    context: ContextType,
    sessionOptions: Partial<UserSessionOptions>
  ): Promise<ApiTestContext<SessionType>> => {
    const apiContext: ApiTestContext<SessionType> = setupApiTest(context, sessionOptions);

    const sessionOpts = apiContext.app.locals['sessionOptions'];
    expect(sessionOpts).not.toBeUndefined();
    await addDataToSessionStore(apiContext, {});
    return apiContext;
  };

  const basicTest = async (context: ApiTestContext, startingUrl: (typeof context)['startingUrl']) => {
    context.startingUrl = startingUrl;
    const st = setupSupertestContext(context);

    const response = await st;
    return response;
  };

  test('Should find login at default endpoint with implicit setting', async (context: TaskContext) => {
    const apiContext = await withApi<TaskContext, WithSessionTestContext>(context, { loginPath: undefined });
    apiContext.loginEmail = 'test@example.com';
    const sessionOpts: UserSessionOptions = apiContext.app.locals['sessionOptions'];
    expect(sessionOpts.loginPath).toBeUndefined();

    const loginResponse = await loginWithContext(apiContext, apiContext.loginEmail);
    expect(loginResponse.statusCode).toEqual(HttpStatusCode.OK);
  });

  test('Should find login with path explicitly specified same as default', async (context: TaskContext) => {
    const apiContext = await withApi<TaskContext, WithSessionTestContext>(context, { loginPath: '/login' });
    apiContext.loginEmail = 'test@example.com';
    const sessionOpts: UserSessionOptions = apiContext.app.locals['sessionOptions'];
    expect(sessionOpts.loginPath).toEqual('/login');

    const loginResponse = await loginWithContext(apiContext, apiContext.loginEmail);
    expect(loginResponse.statusCode).toEqual(HttpStatusCode.OK);
  });

  test('Should not find login with path changed from default', async (context: TaskContext) => {
    const apiContext = await withApi<TaskContext, WithSessionTestContext>(context, { loginPath: '/auth' });
    apiContext.loginEmail = 'test@example.com';
    const sessionOpts: UserSessionOptions = apiContext.app.locals['sessionOptions'];
    expect(sessionOpts.loginPath).toEqual('/auth');

    const loginResponse = await loginWithContext(apiContext, apiContext.loginEmail);
    expect(loginResponse.statusCode).toEqual(HttpStatusCode.NOT_FOUND);
  });
});
