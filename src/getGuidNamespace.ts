import { uuid5 } from './types.js';
import { validate } from 'uuid';

const LIBRARY_DEFAULT_USERID_UUID_NAMESPACE = 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

// TODO: This is duplicated.
export const getUuidNamespace = (systemDefault?: string): uuid5 => {
  const libUidNamespace: uuid5|undefined = process.env['LIBRARY_DEFAULT_USERID_UUID_NAMESPACE'];
  if (libUidNamespace) {
    if (!validate(libUidNamespace)) {
      throw new Error(`Invalid environment value for 'LIBRARY_DEFAULT_USERID_UUID_NAMESPACE' ${libUidNamespace}`);
    }
    return libUidNamespace;
  }
  if (undefined !== systemDefault) {
    if (!validate(systemDefault)) {
      throw new Error(`Invalid system UUID namespace ${systemDefault}`);
    }
    return systemDefault as uuid5;
  }

  return LIBRARY_DEFAULT_USERID_UUID_NAMESPACE;
};
