import { USER_ID_NAMESPACE_KEY, setAppUserIdNamespace } from './auth/userNamespace.js';
import {
  postLoginUserSessionMiddleware,
  preLoginUserSessionMiddleware,
  sessionUserRouteHandlers,
} from './sessionMiddlewareHandlers.js';

import { UserSessionOptions } from './types/sessionOptions.js';
import express from 'express';
import { requireEnv } from '@tjsr/simple-env-utils';
import { useUserSessionMiddlewareV1 } from './useUserSessionMiddleware.js';

export const useUserSessionMiddleware = (
  app: express.Application,
  sessionOptions?: Partial<UserSessionOptions> | undefined
) =>
  sessionOptions?.usmVersion === 1
    ? useUserSessionMiddlewareV1(app, sessionOptions)
    : useUserSessionMiddlewareV2(app, sessionOptions);

export const useUserSessionMiddlewareV2 = (
  app: express.Application,
  sessionOptions?: Partial<UserSessionOptions> | undefined
) => {
  if (sessionOptions?.debugCallHandlers) {
    app.set('debugCallHandlers', true);
  }
  setAppUserIdNamespace(app, sessionOptions?.userIdNamespace || requireEnv(USER_ID_NAMESPACE_KEY));

  app.use(preLoginUserSessionMiddleware(sessionOptions));

  sessionUserRouteHandlers(app, sessionOptions);

  app.use(postLoginUserSessionMiddleware(sessionOptions));
};
