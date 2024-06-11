import assert from "assert";
import express from "express";

export const COOKIE_WITH_HEADER = true;

export const setSessionCookie = (
  request: express.Request,
  response: express.Response
):void => {
  assert(request.sessionID !== undefined);
  console.debug(setSessionCookie, `Setting session cookie to ${request.sessionID}.`);
  assert(request.session !== undefined);
  assert(request.session.id !== undefined);
  if (COOKIE_WITH_HEADER) {
    response.set('Set-Cookie', `sessionId=${request.sessionID}; Path=/; HttpOnly; SameSite=Strict`);
  } else {
    response.cookie('sessionId', request.sessionID, { httpOnly: true, path: '/', sameSite: 'strict' });
  }
};
