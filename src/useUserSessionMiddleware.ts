import { getUserIdNamespace, setAppUserIdNamespace, setUserIdNamespace } from './auth/userNamespace.js';
import {
  postLoginUserSessionMiddleware,
  preLoginUserSessionMiddleware,
  sessionUserRouteHandlers,
} from './sessionMiddlewareHandlers.js';

import { IdNamespace } from './types.js';
import { UserSessionOptions } from './types/sessionOptions.js';
import express from 'express';

export const useUserSessionMiddleware = (app: express.Express, sessionOptions?: Partial<UserSessionOptions> | undefined) => {
  if (sessionOptions?.debugCallHandlers) {
    app.set('debugCallHandlers', true);
  }
  if (sessionOptions?.userIdNamespace) {
    setUserIdNamespace(sessionOptions.userIdNamespace);
    setAppUserIdNamespace(app, sessionOptions.userIdNamespace);
  } else {
    const idNamespace: IdNamespace = getUserIdNamespace();
    setAppUserIdNamespace(app, idNamespace);
  }

  app.use(preLoginUserSessionMiddleware(sessionOptions));

  sessionUserRouteHandlers(app, sessionOptions);

  app.use(postLoginUserSessionMiddleware());
};
