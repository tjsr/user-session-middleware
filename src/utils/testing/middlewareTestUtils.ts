import { endErrorRequest, endRequest } from '../../middleware/handleTestEndEvents.js';
import express, { ErrorRequestHandler, Express, RequestHandler } from '../../express/index.js';

import { MemoryStore } from '../../express-session/index.js';
import { MiddlewareTypes } from '../../testUtils.js';
import { UserSessionOptions } from '../../types/sessionOptions.js';
import { expressSessionHandlerMiddleware } from '../../getSession.js';
import { sessionErrorHandler } from '../../middleware/sessionErrorHandler.js';
import { useUserSessionMiddleware } from '../../useUserSessionMiddleware.js';
import { validateApp } from './apiTestUtils.js';

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
