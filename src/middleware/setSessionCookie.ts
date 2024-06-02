import { SystemHttpRequestType, SystemSessionDataType } from "../types.js";

import assert from "assert";
import express from "express";

export const COOKIE_WITH_HEADER = true;

export const setSessionCookie = (
  request: SystemHttpRequestType<SystemSessionDataType>,
  response: express.Response
) => {
  assert(request.sessionID !== undefined);
  console.debug(setSessionCookie, `Setting session cookie to ${request.sessionID}.`);
  assert(request.session !== undefined);
  assert(request.session.id !== undefined);
  if (COOKIE_WITH_HEADER) {
    response.set('Set-Cookie', `sessionId=${request.sessionID}`);
  } else {
    response.cookie('sessionId', request.sessionID, { httpOnly: true });
  }
};
