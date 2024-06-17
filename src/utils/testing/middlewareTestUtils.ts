import { endErrorRequest, endRequest } from '../../middleware/handleTestEndEvents.js';
import express, { ErrorRequestHandler, Express, RequestHandler } from "../../express/index.js";

import { HttpStatusCode } from '../../httpStatusCodes.js';
import { MemoryStore } from "../../express-session/index.js";
import { MiddlewareTypes } from '../../testUtils.js';
import { expressSessionHandlerMiddleware } from '../../getSession.js';
import { sessionErrorHandler } from '../../middleware/sessionErrorHandler.js';

export const addExpressSessionHandler = (app: Express, memoryStore: MemoryStore): void => {
  app.use(expressSessionHandlerMiddleware(undefined, memoryStore));
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
): { app: Express; memoryStore: MemoryStore; } => {

  const app: Express = express();
  addHandlersToApp(app, middleware, endMiddleware);

  return { app, memoryStore: undefined! };
};

export const appWithMiddleware = (
  middleware: MiddlewareTypes,
  endMiddleware?: MiddlewareTypes
): { app: Express; memoryStore: MemoryStore; } => {
  const memoryStore: MemoryStore = new MemoryStore();

  const app: Express = express();
  addExpressSessionHandler(app, memoryStore);
  addHandlersToApp(app, middleware, endMiddleware);

  return { app, memoryStore };
};
