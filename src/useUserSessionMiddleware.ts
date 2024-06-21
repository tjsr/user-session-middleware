import {
  postLoginUserSessionMiddleware,
  preLoginUserSessionMiddleware,
  sessionUserRouteHandlers
} from './sessionMiddlewareHandlers.js';

import { UserSessionOptions } from './types/sessionOptions.js';
import express from "express";
import { setUserIdNamespace } from './auth/userNamespace.js';

export const useUserSessionMiddleware = (
  app: express.Express,
  sessionOptions?: Partial<UserSessionOptions> | undefined
) => {
  if (sessionOptions?.debugCallHandlers) {
    app.set('debugCallHandlers', true);
  }
  if (sessionOptions?.userIdNamespace) {
    setUserIdNamespace(sessionOptions.userIdNamespace);
  }

  app.use(
    preLoginUserSessionMiddleware(sessionOptions)
  );

  sessionUserRouteHandlers(app, sessionOptions);

  app.use(
    postLoginUserSessionMiddleware()
  );
};
