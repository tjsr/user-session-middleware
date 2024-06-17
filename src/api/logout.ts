import { AuthenticationRestResult } from '../types/apiResults.js';
import { HttpStatusCode } from '../httpStatusCodes.js';
import { LogoutFailedError } from '../errors/errorClasses.js';
import { UserId } from '../types.js';
import { UserSessionData } from '../types/session.js';
import { UserSessionMiddlewareRequestHandler } from '../types/middlewareHandlerTypes.js';
import express from 'express';
import { getUserIdFromRequest } from '../auth/user.js';

export const logout: UserSessionMiddlewareRequestHandler<UserSessionData> =
  async (
    request,
    res,
    next: express.NextFunction
  ) => {
    try {
      const userId: UserId|undefined = await getUserIdFromRequest(request);
      console.log(`Got logout userId ${userId}`);
      const result: AuthenticationRestResult = {
        email: undefined,
        isLoggedIn: false,
      };
      request.session.userId = undefined!;
      request.session.email = undefined!;
      // Save immediately when logging out.
      return new Promise((resolve, reject) => {
        request.session.save((err: Error) => {
          if (err) {
            const logoutErr = new LogoutFailedError('Error logging out while saving session.', err);
            console.error('Failed saving session', logoutErr, err);
            next(logoutErr);
            reject(logoutErr);
          } else {
            res.status(HttpStatusCode.OK);
            res.send(result);
            next();
            resolve();
          }
        });
      });
    } catch (e) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR);
      const errLogout = new LogoutFailedError('Error logging out.', e);
      next(errLogout);
      return Promise.reject(errLogout);
    }
  };
