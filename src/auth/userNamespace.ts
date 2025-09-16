import express, { NextFunction } from '../express/index.ts';

import { IdNamespace } from '../types.ts';
import { UUIDNamespaceNotDefinedError } from '../errors/middlewareErrorClasses.ts';
import { verifyAppLocalsSession } from '../middleware/requestVerifiers.ts';

export const USER_ID_NAMESPACE_KEY = 'USERID_UUID_NAMESPACE'; // || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

export const getAppUserIdNamespace = (app: express.Application, errorHandlerNext?: NextFunction): IdNamespace => {
  const sessionOptions = verifyAppLocalsSession(app.locals);
  const namespaceValue = sessionOptions.userIdNamespace;

  if (!namespaceValue) {
    console.error(getAppUserIdNamespace, 'No namespace set on app - required.');
    const err = new UUIDNamespaceNotDefinedError();
    if (errorHandlerNext) {
      errorHandlerNext(err);
      return undefined!;
    } else {
      throw err;
    }
  }
  return namespaceValue;
};
