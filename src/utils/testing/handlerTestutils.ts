import { MiddlewareHandlerTestContext, UserAppTestContext } from '../../api/utils/testcontext.ts';
import { SessionTestContext, setupSessionContext } from './context/session.ts';

import { TestContext } from 'vitest';
import { UserIdTestContext } from './context/idNamespace.ts';
import { addHandlersToApp } from './middlewareTestUtils.ts';
import express from '../../express/index.ts';
import { useUserSessionMiddleware } from '../../useUserSessionMiddleware.ts';
import { verifyAppConfig } from '../../middleware/requestVerifiers.ts';

export const createHandlerTestContext = (
  context: (UserAppTestContext | (MiddlewareHandlerTestContext & SessionTestContext)) & UserIdTestContext & TestContext
) => {
  const sessionContext = context as SessionTestContext;
  setupSessionContext(context);
  const appContext = context as UserAppTestContext;
  const middlewareContext = context as MiddlewareHandlerTestContext;
  if (appContext.app === undefined) {
    appContext.app = express();
  }
  useUserSessionMiddleware(appContext.app, sessionContext.sessionOptions);
  verifyAppConfig(appContext.app);

  addHandlersToApp(appContext.app, middlewareContext.preSessionMiddleware, middlewareContext.postSessionMiddleware);
};
