import {
  postLoginUserSessionMiddleware,
  preLoginUserSessionMiddleware,
  sessionUserRouteHandlers
} from './sessionMiddlewareHandlers.js';

import { UserSessionOptions } from './types/sessionOptions.js';
import express from "express";

export const useUserSessionMiddleware = (
  app: express.Express,
  sessionOptions?: Partial<UserSessionOptions> | undefined
) => {
  app.use(
    preLoginUserSessionMiddleware(sessionOptions)
  );

  sessionUserRouteHandlers(app, sessionOptions);

  app.use(
    postLoginUserSessionMiddleware()
  );
};
