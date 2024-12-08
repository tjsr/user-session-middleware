import { IdNamespace } from '../types.js';
import { UUIDNamespaceNotDefinedError } from '../errors/middlewareErrorClasses.js';
import { UserSessionOptions } from '../types/sessionOptions.js';

export const getDefaultUserIdNamespace = (sessionOptions: Partial<UserSessionOptions>): IdNamespace | undefined => {
  const usmOptions = sessionOptions as UserSessionOptions;
  if (usmOptions?.userIdNamespace) {
    return usmOptions.userIdNamespace;
  }
  if (!process.env['USER_ID_NAMESPACE']) {
    throw new UUIDNamespaceNotDefinedError();
  }
  return process.env['USER_ID_NAMESPACE'];
};
