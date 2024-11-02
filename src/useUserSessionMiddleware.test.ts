import { ApiTestContext, UserAppTaskContext, UserIdTaskContext } from './api/utils/testcontext.js';

import { setUserIdNamespaceForTest } from './utils/testing/testNamespaceUtils.js';
import { testableApp } from './utils/testing/middlewareTestUtils.js';
import { useUserSessionMiddleware } from './useUserSessionMiddleware.js';

describe('useUserSessionMiddleware', () => {
  // beforeEach((context: UserIdTaskContext & UserAppTaskContext) => {
  //   setUserIdNamespaceForTest(context);
  // });
  beforeEach((context: ApiTestContext) => {
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

  it('Should be able to configure the app when no userIdNamespace is provided.', (context: UserIdTaskContext &
    UserAppTaskContext) => {
    useUserSessionMiddleware(context.app, {});
  });
});
