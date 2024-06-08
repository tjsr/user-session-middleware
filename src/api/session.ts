import {
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemSessionDataType
} from '../types.js';

import express from 'express';

export const session = <
RequestType extends SystemHttpRequestType<SessionType>,
SessionType extends SystemSessionDataType,
ResponseType extends SystemHttpResponseType<StoreType>,
StoreType extends SessionStoreDataType
>(
    request: RequestType, response: ResponseType, next: express.NextFunction) => {
  console.debug(session, 'Retrieving session id:', request.sessionID, request.session.id);
  request.session.save();
  response.status(200);
  response.send({
    sessionId: request.sessionID,
  });
  next();
};
