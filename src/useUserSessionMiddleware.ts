import { USER_ID_NAMESPACE_KEY, setAppUserIdNamespace, setUserIdNamespace } from './auth/userNamespace.js';
import {
  postLoginUserSessionMiddleware,
  preLoginUserSessionMiddleware,
  sessionUserRouteHandlers,
} from './sessionMiddlewareHandlers.js';

import { UserSessionOptions } from './types/sessionOptions.js';
import express from 'express';
import { requireEnv } from '@tjsr/simple-env-utils';

export const useUserSessionMiddlewareV1 = (
  app: express.Application,
  sessionOptions?: Partial<UserSessionOptions> | undefined
) => {
  if (sessionOptions?.debugCallHandlers) {
    app.set('debugCallHandlers', true);
  }
  if (sessionOptions?.userIdNamespace) {
    setUserIdNamespace(sessionOptions.userIdNamespace);
    setAppUserIdNamespace(app, sessionOptions.userIdNamespace);
  } else {
    const envNamespace = requireEnv(USER_ID_NAMESPACE_KEY);
    setAppUserIdNamespace(app, envNamespace);
  }

  app.use(preLoginUserSessionMiddleware(sessionOptions));

  sessionUserRouteHandlers(app, sessionOptions);

  app.use(postLoginUserSessionMiddleware());
};
