import assert from 'assert';

import { stringifySetCookie } from 'cookie';
import signature from 'cookie-signature';
import express from 'express';

import { getSessionOptionsFromRequest } from './requestVerifiers.ts';
import { UserSessionOptions } from '../types/sessionOptions.ts';

type SessionSecretSet = string | string[];

export const requireStringSessionSecret = (secret: UserSessionOptions['secret']): SessionSecretSet => {
  if (typeof secret === 'string' || (Array.isArray(secret) && secret.every((value) => typeof value === 'string'))) {
    return secret;
  }
  throw new Error('Deprecated cookie helper requires string secrets; use the session middleware for binary keys.');
};

export const COOKIE_WITH_HEADER = true;

export const getSignedCookieValue = (cookieValue: string, secret: SessionSecretSet): string => {
  if (typeof secret === 'string') {
    const signedCookieValue = 's:' + signature.sign(cookieValue, secret);
    return signedCookieValue;
  } else if (Array.isArray(secret) && secret.length > 0) {
    const signedCookieValue = 's:' + signature.sign(cookieValue, secret[0]!);
    return signedCookieValue;
  }
  throw new Error('Secret must be a string or an array of strings.');
};

const setSignedSessionCookie = (
  cookieName: string,
  sessionId: string,
  response: express.Response,
  secret: SessionSecretSet
): void => {
  console.debug(setRequestSessionCookie, `Setting ${cookieName} cookie to ${sessionId}.`);

  const cookieOptions = { httpOnly: true, path: '/', sameSite: 'strict' as const };
  const signedCookieValue = getSignedCookieValue(sessionId, secret);
  if (COOKIE_WITH_HEADER) {
    const cookieString = stringifySetCookie(
      { ...cookieOptions, name: cookieName, value: signedCookieValue },
      { encode: encodeURIComponent }
    );
    response.set('Set-Cookie', cookieString);
  } else {
    response.cookie(cookieName, signedCookieValue, cookieOptions);
  }
};

/**
 * @deprecated enable middleware to set cookies rather than calling explicitly.
 * @param request
 * @param response
 */
export const setRequestSessionCookie = (
  request: express.Request,
  response: express.Response,
  sessionSecret?: SessionSecretSet
): void => {
  const sessionOptions: UserSessionOptions = getSessionOptionsFromRequest(request);

  assert(request.sessionID !== undefined);
  assert(request.session !== undefined, 'Session was not created on request');
  if (request.session.id === undefined) {
    console.debug(`session.id was undefined but req.sessionID=${request.sessionID}`);
  }

  if (!sessionSecret) {
    sessionSecret = requireStringSessionSecret(sessionOptions.secret);
  }

  setSignedSessionCookie(sessionOptions.name!, request.sessionID, response, sessionSecret);
};
