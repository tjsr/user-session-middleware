import { MiddlewareHandlerTestContext, UserAppTaskContext } from '../../api/utils/testcontext.ts';
import { SessionTestContext, setupSessionContext } from './context/session.ts';

import { TaskContext } from 'vitest';
import { UserIdTaskContext } from './context/idNamespace.ts';
import { addHandlersToApp } from './middlewareTestUtils.ts';
import express from '../../express/index.ts';
import { useUserSessionMiddleware } from '../../useUserSessionMiddleware.ts';
import { verifyAppConfig } from '../../middleware/requestVerifiers.ts';

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
