import { NamespaceUUIDFormatError, UUIDNamespaceNotDefinedError } from './errors/middlewareErrorClasses.ts';
import {
  postLoginUserSessionMiddleware,
  preLoginUserSessionMiddleware,
  sessionUserRouteHandlers,
} from './sessionMiddlewareHandlers.ts';

import { USER_ID_NAMESPACE_KEY } from './auth/userNamespace.ts';
import { UserSessionOptions } from './types/sessionOptions.ts';
import express from './express/index.ts';
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
