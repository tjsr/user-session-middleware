import { USER_ID_NAMESPACE_KEY } from '../auth/userNamespace.ts';
import { UUIDNamespaceNotDefinedError } from '../errors/middlewareErrorClasses.ts';
import express from '../express/index.ts';

export const requireAppUserNamespace = (app: express.Application) => {
  if (!app.get(USER_ID_NAMESPACE_KEY)) {
    console.error(requireAppUserNamespace, 'No namespace set on app - required.');
    throw new UUIDNamespaceNotDefinedError();
  }
};
