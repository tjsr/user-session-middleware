import { endErrorRequest, endRequest } from '../../middleware/handleTestEndEvents.js';
import express, { ErrorRequestHandler, Express, RequestHandler } from "../../express/index.js";

import { HttpStatusCode } from '../../httpStatusCodes.js';
import { MemoryStore } from "../../express-session/index.js";
import { MiddlewareTypes } from '../../testUtils.js';
import { SessionOptions } from 'express-session';
import { UserSessionOptions } from '../../types/sessionOptions.js';
import { expressSessionHandlerMiddleware } from '../../getSession.js';
import { sessionErrorHandler } from '../../middleware/sessionErrorHandler.js';
import { useUserSessionMiddleware } from '../../useUserSessionMiddleware.js';

export const addExpressSessionHandler = (app: Express, sessionOptions?: Partial<SessionOptions> | undefined): void => {
  app.use(expressSessionHandlerMiddleware(sessionOptions));
};

export const addHandlersToApp = (
  app: Express,
  middleware: (RequestHandler | ErrorRequestHandler)[],
  endMiddleware?: (RequestHandler | ErrorRequestHandler)[]
): void => {
  app.use(middleware);
  app.get('/', (_req, res, next) => {
    res.status(HttpStatusCode.OK);
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
  middleware: MiddlewareTypes,
  endMiddleware?: MiddlewareTypes | undefined,
  sessionOptions?: Partial<SessionOptions> | undefined
): { app: Express; memoryStore: MemoryStore } => {
  const memoryStore: MemoryStore = new MemoryStore();

  const app: Express = express();
  const useOptions = { ...sessionOptions };
  if (useOptions.store === undefined) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('MemoryStore should not be used in production');
    }
    useOptions.store = memoryStore;
  }
  addExpressSessionHandler(app, useOptions);
  addHandlersToApp(app, middleware, endMiddleware);

  return { app, memoryStore };
};

export const testableApp = (
  options?: Partial<UserSessionOptions>
) => {
  const app: Express = express();
  useUserSessionMiddleware(app, options);
  return app;
};
