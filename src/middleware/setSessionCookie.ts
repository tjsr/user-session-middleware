import { SESSION_SECRET } from '../getSession.js';
import assert from 'assert';
import cookie from 'cookie';
import express from 'express';
import signature from 'cookie-signature';

export const COOKIE_WITH_HEADER = true;
const APP_LOCALS_REQUIRED = false;

export const getSignedCookieValue = (cookieValue: string, secret: string): string => {
  const signedCookieValue = 's:' + signature.sign(cookieValue, secret);
  return signedCookieValue;
};

export const setSignedSessionCookie = (cookieName: string, sessionId: string, response: express.Response): void => {
  console.debug(setRequestSessionCookie, `Setting ${cookieName} cookie to ${sessionId}.`);

  const cookieOptions: cookie.SerializeOptions = { httpOnly: true, path: '/', sameSite: 'strict' };
  const signedCookieValue = getSignedCookieValue(sessionId, SESSION_SECRET);
  if (COOKIE_WITH_HEADER) {
    const cookieString = cookie.serialize(cookieName, signedCookieValue, cookieOptions);
    response.set('Set-Cookie', cookieString);
  } else {
    response.cookie(cookieName, signedCookieValue, cookieOptions);
  }
};

export const setRequestSessionCookie = (request: express.Request, response: express.Response): void => {
  let sessionCookieKey = 'usm.sid';
  if (APP_LOCALS_REQUIRED) {
    assert(request.app !== undefined, 'Request requires an app');
    assert(request.app.locals !== undefined, 'Request app requires locals');
    sessionCookieKey = request.app.locals['cookieSessionIdName'] || 'usm.sid';
  }
  assert(sessionCookieKey !== undefined, 'App locals requires cookieSessionIdName to be defined');

  assert(request.sessionID !== undefined);
  assert(request.session !== undefined, 'Session was not created set on request');
  if (request.session.id === undefined) {
    console.debug(`session.id was undefined but req.sessionID=${request.sessionID}`);
  }

  setSignedSessionCookie(sessionCookieKey, request.sessionID, response);
};
