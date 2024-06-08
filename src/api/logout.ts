import { AuthenticationRestResult, getUserId } from '../auth/user.js';
import { SystemHttpRequestType, SystemSessionDataType, UserId } from '../types.js';
import express, { NextFunction } from 'express';

export const logout = <
RequestType extends SystemHttpRequestType<SessionType>,
SessionType extends SystemSessionDataType
>(
    request: RequestType, res: express.Response, next:NextFunction) => {
  const userId: UserId = getUserId(request);
  console.log(`Got logout userId ${userId}`);
  const result: AuthenticationRestResult = {
    email: undefined,
    isLoggedIn: false,
  };
  try {
    request.session.userId = undefined;
    request.session.email = undefined;

    // Need to use a barrier or callback here.
    request.session.save((err: Error) => {
      if (err) {
        console.error('Failed saving session', err);
        next(err);
      }
      res.status(200);
      res.send(result);
      next();
    });
  } catch (e) {
    res.status(500);
    console.warn(e);
    res.send(result);
    next(e);
  }
};
