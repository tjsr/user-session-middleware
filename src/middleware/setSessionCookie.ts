import assert from "assert";
import cookie from 'cookie';
import express from 'express';

export const COOKIE_WITH_HEADER = true;

export const setSessionCookie = (request: express.Request, response: express.Response): void => {
  assert(request.app !== undefined, 'Request requires an app');
  assert(request.app.locals !== undefined, 'Request app requires locals');
  const cookieSessionIdName = request.app.locals['cookieSessionIdName'];
  assert(cookieSessionIdName !== undefined, 'App locals requires cookieSessionIdName to be defined');

  assert(request.sessionID !== undefined);
  console.debug(setSessionCookie, `Setting ${cookieSessionIdName} cookie to ${request.sessionID}.`);
  assert(request.session !== undefined);
  assert(request.session.id !== undefined);
  const cookieOptions: cookie.SerializeOptions = { httpOnly: true, path: '/', sameSite: 'strict' };
  const cookieString = cookie.serialize(cookieSessionIdName, request.sessionID, cookieOptions);
  if (COOKIE_WITH_HEADER) {
    response.set('Set-Cookie', cookieString);
  } else {
    response.cookie(cookieSessionIdName, request.sessionID, cookieOptions);
  }
};
