import { IdNamespace } from '../types.ts';
import { UUIDNamespaceNotDefinedError } from '../errors/middlewareErrorClasses.ts';
import { UserSessionOptions } from '../types/sessionOptions.ts';

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
