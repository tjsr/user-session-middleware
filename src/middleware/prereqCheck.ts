import { USER_ID_NAMESPACE_KEY } from '../auth/userNamespace.js';
import { UUIDNamespaceNotDefinedError } from '../errors/middlewareErrorClasses.js';
import express from '../express/index.js';

export const requireAppUserNamespace = (app: express.Application) => {
  if (!app.get(USER_ID_NAMESPACE_KEY)) {
    console.error(requireAppUserNamespace, 'No namespace set on app - required.');
    throw new UUIDNamespaceNotDefinedError();
  }
};
