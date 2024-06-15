import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';
import express from 'express';

export const session: UserSessionMiddlewareRequestHandler = (
  request,
  response,
  next: express.NextFunction
) => {
  console.debug(session, 'Retrieving session id:', request.sessionID, request.session.id);
  request.session.save();
  response.status(200);
  response.send({
    sessionId: request.sessionID,
  });
  next();
};
