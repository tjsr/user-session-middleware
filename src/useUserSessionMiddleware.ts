import { NamespaceUUIDFormatError, UUIDNamespaceNotDefinedError } from './errors/middlewareErrorClasses.js';
import {
  postLoginUserSessionMiddleware,
  preLoginUserSessionMiddleware,
  sessionUserRouteHandlers,
} from './sessionMiddlewareHandlers.js';

import { USER_ID_NAMESPACE_KEY } from './auth/userNamespace.js';
import { UserSessionOptions } from './types/sessionOptions.js';
import express from './express/index.js';
import { requireEnv } from '@tjsr/simple-env-utils';
import { validate } from 'uuid';

export const useUserSessionMiddleware = (app: express.Application, sessionOptions: UserSessionOptions) => {
  if (sessionOptions.debugCallHandlers) {
    app.set('debugCallHandlers', true);
  }
  if (!sessionOptions.userIdNamespace) {
    const envNamespace = requireEnv(USER_ID_NAMESPACE_KEY);
    if (envNamespace === undefined) {
      throw new UUIDNamespaceNotDefinedError();
    }
    if (!validate(envNamespace!)) {
      throw new NamespaceUUIDFormatError(envNamespace!, 'Environment USERID_UUID_NAMESPACE is not a valid UUID.');
    }

    sessionOptions.userIdNamespace = envNamespace;
  }
  app.locals['sessionOptions'] = sessionOptions;

  app.use(preLoginUserSessionMiddleware(sessionOptions));

  sessionUserRouteHandlers(app, sessionOptions);

  app.use(postLoginUserSessionMiddleware());
};
