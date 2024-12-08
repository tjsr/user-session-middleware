import { MiddlewareHandlerTestContext, UserAppTaskContext } from '../../api/utils/testcontext.js';
import { SessionTestContext, setupSessionContext } from './context/session.js';

import { TaskContext } from 'vitest';
import { UserIdTaskContext } from './context/idNamespace.js';
import { addHandlersToApp } from './middlewareTestUtils.js';
import express from '../../express/index.js';
import { useUserSessionMiddleware } from '../../useUserSessionMiddleware.js';
import { verifyAppConfig } from '../../middleware/requestVerifiers.js';

export const createHandlerTestContext = (
  context: (UserAppTaskContext | (MiddlewareHandlerTestContext & SessionTestContext)) & UserIdTaskContext & TaskContext
) => {
  const sessionContext = context as SessionTestContext;
  setupSessionContext(context);
  const appContext = context as UserAppTaskContext;
  const middlewareContext = context as MiddlewareHandlerTestContext;
  if (appContext.app === undefined) {
    appContext.app = express();
  }
  useUserSessionMiddleware(appContext.app, sessionContext.sessionOptions);
  verifyAppConfig(appContext.app);

  addHandlersToApp(appContext.app, middlewareContext.preSessionMiddleware, middlewareContext.postSessionMiddleware);
};
