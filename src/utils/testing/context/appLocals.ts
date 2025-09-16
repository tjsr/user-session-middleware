import { ExpressAppTaskContext, UserAppTaskContext } from '../../../api/utils/testcontext.ts';
import express, { NextFunction } from '../../../express/index.ts';

import { HttpStatusCode } from '../../../httpStatusCodes.ts';
import { SessionTestContext } from './session.ts';
import { SystemHttpRequestType } from '../../../types/request.ts';
import { useUserSessionMiddleware } from '../../../useUserSessionMiddleware.ts';

export const setupExpressContext = (context: SessionTestContext): UserAppTaskContext => {
  assert(context.sessionOptions !== undefined, 'sessionOptions must be defined. Call setupSessionContext() first.');
  const appContext = context as unknown as UserAppTaskContext;
  if (appContext.app !== undefined) {
    throw new Error(`app is already defined on context for test ${context.task.suite?.name}/${context.task.name}`);
  }
  const app: express.Express = express();
  app.locals = app.locals || {};
  app.locals['sessionOptions'] = context.sessionOptions;
  appContext.app = app;

  return appContext;
};

export const setupMiddlewareContext = (
  context: SessionTestContext & { noCreateDefaultRoute?: boolean }
): UserAppTaskContext => {
  const appContext: ExpressAppTaskContext = setupExpressContext(context);
  useUserSessionMiddleware(appContext.app, context.sessionOptions);

  if (context.noCreateDefaultRoute !== true) {
    appContext.app.get('/', (_req, response, next) => {
      response.status(HttpStatusCode.OK);
      response.send();
      next();
    });

    const endValidator = (req: SystemHttpRequestType, _res: express.Response, next: NextFunction) => {
      expect(req.session, 'Session was undefined on request').not.toBeUndefined();
      expect(req.session.userId, 'User was undefined on session').not.toBeUndefined();
      context.task.context.expect(req.session.userId, 'User was undefined on session').not.toBeUndefined();
      next();
    };
    appContext.app.use(endValidator);
  }

  return appContext as UserAppTaskContext;
};
