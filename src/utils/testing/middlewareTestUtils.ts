import { endErrorRequest, endRequest } from '../../middleware/handleTestEndEvents.ts';
import express, { ErrorRequestHandler, Express, RequestHandler } from '../../express/index.ts';

import { MemoryStore } from '../../express-session/index.ts';
import { MiddlewareTypes } from '../../testUtils.ts';
import { UserSessionOptions } from '../../types/sessionOptions.ts';
import { expressSessionHandlerMiddleware } from '../../getSession.ts';
import { sessionErrorHandler } from '../../middleware/sessionErrorHandler.ts';
import { useUserSessionMiddleware } from '../../useUserSessionMiddleware.ts';
import { validateApp } from './apiTestUtils.ts';

const _addExpressSessionHandler = (app: express.Application, sessionOptions: UserSessionOptions): void => {
  validateApp(app);
  app.use(
    expressSessionHandlerMiddleware({
      ...sessionOptions,
      resave: sessionOptions?.resave !== undefined ? sessionOptions.resave : true,
      saveUninitialized: sessionOptions?.saveUninitialized !== undefined ? sessionOptions.saveUninitialized : true,
    })
  );
};

export const addHandlersToApp = (
  app: express.Application,
  middleware: (RequestHandler | ErrorRequestHandler)[],
  endMiddleware?: (RequestHandler | ErrorRequestHandler)[]
): void => {
  validateApp(app);
  if (middleware.length > 0) {
    app.use(middleware);
  }
  app.get('/', (_req, _res, next) => {
    next();
  });
  if (endMiddleware) {
    app.use(endMiddleware);
  }
  app.use(sessionErrorHandler);
  app.use(endRequest);
  app.use(endErrorRequest);
};

export const sessionlessAppWithMiddleware = (
  middleware: MiddlewareTypes,
  endMiddleware?: MiddlewareTypes
): { app: Express; memoryStore: MemoryStore } => {
  const app: Express = express();
  addHandlersToApp(app, middleware, endMiddleware);

  return { app, memoryStore: undefined! };
};

export const appWithMiddleware = (
  sessionOptions: UserSessionOptions,
  middleware: MiddlewareTypes,
  endMiddleware?: MiddlewareTypes
): { app: Express; memoryStore: MemoryStore } => {
  const memoryStore: MemoryStore = new MemoryStore();

  const app: Express = express();
  useUserSessionMiddleware(app, sessionOptions);
  // addExpressSessionHandler(app, sessionOptions);
  addHandlersToApp(app, middleware, endMiddleware);

  return { app, memoryStore };
};
