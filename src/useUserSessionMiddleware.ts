import { USER_ID_NAMESPACE_KEY, setAppUserIdNamespace, setUserIdNamespace } from './auth/userNamespace.js';
import {
  postLoginUserSessionMiddleware,
  preLoginUserSessionMiddleware,
  sessionUserRouteHandlers,
} from './sessionMiddlewareHandlers.js';
import { setAppSessionIdCookieKey, setAppSessionIdHeaderKey } from './middleware/appSettings.js';

import { SessionOptions } from 'express-session';
import { UserSessionOptions } from './types/sessionOptions.js';
import express from './express/index.js';
import { requireEnv } from '@tjsr/simple-env-utils';

export const useUserSessionMiddleware = (
  app: express.Application,
  sessionOptions?: Partial<UserSessionOptions> | undefined
) => {
  if (sessionOptions?.debugCallHandlers) {
    app.set('debugCallHandlers', true);
  }
  setAppSessionIdHeaderKey(app.locals, sessionOptions?.sessionIdHeaderKey);
  setAppSessionIdCookieKey(app.locals, sessionOptions?.name);

  if (sessionOptions?.userIdNamespace) {
    setUserIdNamespace(sessionOptions.userIdNamespace);
    setAppUserIdNamespace(app.locals, sessionOptions.userIdNamespace);
  } else {
    const envNamespace = requireEnv(USER_ID_NAMESPACE_KEY);
    setAppUserIdNamespace(app.locals, envNamespace);
  }

  app.use(preLoginUserSessionMiddleware(sessionOptions));

  sessionUserRouteHandlers(app, sessionOptions);

  app.use(postLoginUserSessionMiddleware());

  app.locals.sessionConfig = sessionOptions as SessionOptions;
};
