import express, { CookieOptions } from 'express';
import { getAppSessionIdCookieKey, getAppSessionIdHeaderKey } from './appSettings.js';
import assert from 'assert';

export const COOKIE_WITH_HEADER = true;
/**
 * @deprecated
 * @param {express.Request} request Express request object
 * @param {express.Response} response Express response object
 */
export const setSessionCookie = (
  request: express.Request,
  response: express.Response,
  options?: CookieOptions
): void => {
  assert(request.sessionID !== undefined);
  assert(request.session !== undefined);
  assert(request.session.id !== undefined);
  const app = request.app;
  const sessionIdHeaderKey = getAppSessionIdHeaderKey(app.locals);
  if (sessionIdHeaderKey) {
    throw new Error('Dont use sessionId header keys for now - use cookie');
  }
  const sessionIdCookieKey = getAppSessionIdCookieKey(app.locals);
  if (!sessionIdCookieKey) {
    throw new Error('Session cookie key not set in app locals');
  }
  // console.warn(setSessionCookie,
  //   `DEPRECATED: Setting session header as Set-Cookie to ${sessionIdCookieKey}=${request.sessionID}.`);
  // response.set('Set-Cookie', `${sessionIdCookieKey}=${request.sessionID}; Path=/; HttpOnly; SameSite=Strict`);
  // } else {
  // console.warn(setSessionCookie,
  // `DEPRECATED: Setting session cookie to ${sessionIdCookieKey}=${request.sessionID}.`);
  const cookieOptions: CookieOptions = {
    ...{ httpOnly: true, path: '/', sameSite: 'strict' },
    ...options,
  };
  response.cookie(sessionIdCookieKey, request.sessionID, cookieOptions);
  // }
};
