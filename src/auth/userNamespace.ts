import {
  NamespaceUUIDFormatError,
  UUIDNamespaceNotDefinedError
} from "../errors/middlewareErrorClasses.js";

import { IdNamespace } from "../types.js";
import { validate } from "uuid";

let USERID_UUID_NAMESPACE: IdNamespace|undefined = process.env['USERID_UUID_NAMESPACE'];
// || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

export const setUserIdNamespace = (namespace: IdNamespace): IdNamespace => {
  const envNamespace: IdNamespace|undefined = process.env['USERID_UUID_NAMESPACE'] === "undefined"
    ? undefined : process.env['USERID_UUID_NAMESPACE'];

  if (namespace === undefined) {
    if (envNamespace === undefined) {
      throw new UUIDNamespaceNotDefinedError();
    }
    if (!validate(envNamespace!)) {
      throw new NamespaceUUIDFormatError(envNamespace!, 'Environment USERID_UUID_NAMESPACE is not a valid UUID.');
    }
    USERID_UUID_NAMESPACE = envNamespace!;
    return USERID_UUID_NAMESPACE;
  }
  
  if (!validate(namespace)) {
    throw new NamespaceUUIDFormatError(namespace);
  }
  USERID_UUID_NAMESPACE = namespace;
  return USERID_UUID_NAMESPACE;
};

export const getUserIdNamespace = (): IdNamespace => {
  if (USERID_UUID_NAMESPACE !== undefined) {
    return USERID_UUID_NAMESPACE;
  }
  if (process.env['USERID_UUID_NAMESPACE'] !== undefined) {
    return process.env['USERID_UUID_NAMESPACE'];
  }
  throw new UUIDNamespaceNotDefinedError();
};
