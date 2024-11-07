import { AppLocals } from '../express/index.js';
import { MiddlewareConfigurationError } from '../errors/errorClasses.js';

export const DEFAULT_SESSION_ID_HEADER = 'x-session-id';
export const DEFAULT_SESSION_ID_COOKIE = 'connect.sid';

export const getAppSessionIdHeaderKey = (appLocals: AppLocals): string | undefined => {
  if (!appLocals) {
    throw new MiddlewareConfigurationError('Request object is not bound to an app');
  }
  return appLocals['sessionIdHeaderKey'];
};

export const getAppSessionIdCookieKey = <Ret extends boolean>(
  appLocals: AppLocals,
  returnDefault?: Ret | undefined
): Ret extends true ? string : string | undefined => {
  if (!appLocals) {
    throw new MiddlewareConfigurationError('Request object is not bound to an app');
  }
  if (returnDefault === true) {
    return appLocals.sessionIdCookieKey || DEFAULT_SESSION_ID_COOKIE;
  }
  // TODO: This shouldn't need ! - it should accept string|undefined as being ok.
  return appLocals.sessionIdCookieKey!;
};

export const setAppSessionIdCookieKey = (
  appLocals: AppLocals,
  cookieKey: string = DEFAULT_SESSION_ID_COOKIE
): string => {
  if (!appLocals) {
    throw new MiddlewareConfigurationError('AppLocals does not exist when setting cookie sessionId key');
  }
  appLocals['sessionIdCookieKey'] = cookieKey;
  return appLocals['sessionIdCookieKey'];
};

export const setAppSessionIdHeaderKey = (appLocals: AppLocals, cookieKey: string | undefined): string | undefined => {
  if (!appLocals) {
    throw new MiddlewareConfigurationError('AppLocals does not exist when setting header sessionId key');
  }
  appLocals['sessionIdHeaderKey'] = cookieKey;
  return appLocals['sessionIdHeaderKey'];
};
