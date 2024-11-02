import express, { Express } from './express/index.js';

import { ApiTestContext } from './api/utils/testcontext.js';
import { setUserIdNamespaceForTest } from './utils/testing/testNamespaceUtils.js';
import { testableApp } from './utils/testing/middlewareTestUtils.js';
import { useUserSessionMiddleware } from './useUserSessionMiddleware.js';

describe<ApiTestContext>('useUserSessionMiddleware', () => {
  // beforeEach((context: UserIdTaskContext & UserAppTaskContext) => {
  //   setUserIdNamespaceForTest(context);
  // });
  beforeEach((context: ApiTestContext) => {
    // context.sessionOptions = {
    //   getTaskContextUserIdNamespace(context);
    // }
    context.app = testableApp(context.sessionOptions);
  });

  it('Should be able to configure the app when the userIdNamespace is provided.', (context: ApiTestContext) => {
    context.sessionOptions = {
      userIdNamespace: context.userIdNamespace,
    };
    context.app = testableApp(context.sessionOptions);
    setUserIdNamespaceForTest(context);
    useUserSessionMiddleware(context.app, { userIdNamespace: context.userIdNamespace });
  });

  it.todo('Should be able to configure the app when no userIdNamespace is provided.', () => {
    const app: Express = express();
    useUserSessionMiddleware(app, {});
  });
});
