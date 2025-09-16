import express, { AppLocals } from '../express/index.ts';

import { MiddlewareConfigurationError } from '../errors/errorClasses.ts';
import { SystemHttpRequestType } from '../types/request.ts';
import { UserSessionData } from '../types/session.ts';
import { UserSessionOptions } from '../types/sessionOptions.ts';

const TEST_MODE = process.env['VITEST'] === 'true';

const verifyRequestApp = (req: SystemHttpRequestType<UserSessionData>): express.Application => {
  if (req.app == undefined) {
    throw new MiddlewareConfigurationError('Request requires an app');
  }
  return req.app;
};

export const verifyAppConfig = (app: express.Application): typeof app.locals => {
  const appLocals = app.locals;
  if (appLocals === undefined) {
    throw new MiddlewareConfigurationError('Request must have app.locals set to get session ID.');
  }
  return appLocals;
};

export const verifyAppLocalsSession = (appLocals: AppLocals): UserSessionOptions => {
  const sessionOptions = appLocals['sessionOptions'];
  if (sessionOptions === undefined) {
    const msg = 'Request app.locals must have sessionOptions set to get session ID.';
    if (TEST_MODE) {
      console.trace(verifyAppLocalsSession, msg);
    }
    throw new MiddlewareConfigurationError(msg);
  }

  if (sessionOptions.name === undefined) {
    throw new MiddlewareConfigurationError(
      'USM requires cookie SID value to be set and does not permit using default.'
    );
  }

  return sessionOptions;
};

export const getSessionOptionsFromRequest = (req: SystemHttpRequestType<UserSessionData>): UserSessionOptions => {
  const app = verifyRequestApp(req);
  const appLocals = verifyAppConfig(app);
  const sessionOptions = verifyAppLocalsSession(appLocals);
  return sessionOptions;
};
