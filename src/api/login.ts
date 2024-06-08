import * as EmailValidator from 'email-validator';

import { AuthenticationRestResult, createUserIdFromEmail } from '../auth/user.js';
import {
  EmailAddress,
  SessionStoreDataType,
  SystemHttpRequestType,
  SystemHttpResponseType,
  SystemSessionDataType
} from '../types.js';

import { NextFunction } from 'express';
import { SESSION_ID_HEADER_KEY } from '../getSession.js';
import { UserModel } from '../types.js';

let retrieveUserData: ((_email: EmailAddress) => UserModel) | undefined = undefined;

export const setRetrieveUserDataFunction = (fn: (_email: EmailAddress) => UserModel) => {
  retrieveUserData = fn;
};

export const getDbUserByEmail = (email: EmailAddress): UserModel => {
  if (retrieveUserData) {
    return retrieveUserData(email);
  }
  return {
    email: email,
    userId: createUserIdFromEmail(email),
  };
};

export const login = <
  RequestType extends SystemHttpRequestType<SessionType>,
  SessionType extends SystemSessionDataType,
  ResponseType extends SystemHttpResponseType<StoreType>,
  StoreType extends SessionStoreDataType
>(
    req: RequestType, res: ResponseType, next: NextFunction) => {
  try {
    const email: string = req.body.email;
    if (!EmailValidator.validate(email)) {
      res.status(400);
      next(new Error('Invalid email'));
      return;
    }

    const user: UserModel = getDbUserByEmail(email);

    if (!user) {
      const result: AuthenticationRestResult = {
        email: undefined,
        isLoggedIn: false,
        message: 'Invalid email',
      };
      req.session.userId = undefined;
      req.session.email = undefined;
      req.session.save((err: Error) => {
        if (err) {
          console.error('Failed saving session', err);
        } else {
          res.status(403);
          res.send(result);
          next(new Error('Forbidden'));
        }
      });

    }

    const result: AuthenticationRestResult = {
      email: email,
      isLoggedIn: true,
      sessionId: req.session.id,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(SESSION_ID_HEADER_KEY, req.session.id);
    res.cookie('sessionId', req.session.id);

    req.session.userId = user.userId;
    req.session.email = email;
    console.log(`User ${email} logged in and has userId ${user.userId}`);
    req.session.save((err: Error) => {
      if (err) {
        console.error('Failed saving session', err);
        next(err);
      } else {
        res.status(200);
        res.send(result);
        next();
      }
    });
  } catch (e) {
    res.status(500);
    console.trace(e);
    res.send();
    next(e);
    return;
  }
};
