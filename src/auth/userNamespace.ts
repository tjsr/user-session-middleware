import { IdNamespace } from "../types.js";
import { UUIDNamespaceNotDefinedError } from "../errors/middlewareErrorClasses.js";

let USERID_UUID_NAMESPACE: IdNamespace|undefined = process.env['USERID_UUID_NAMESPACE'];
// || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

export const setUserIdNamespace = (namespace: IdNamespace): void => {
  USERID_UUID_NAMESPACE = namespace;
};

export const getUserIdNamespace = (): IdNamespace => {
  if (process.env['USERID_UUID_NAMESPACE']) {
    return process.env['USERID_UUID_NAMESPACE'];
  }
  if (USERID_UUID_NAMESPACE === undefined) {
    throw new UUIDNamespaceNotDefinedError();
  }
  return USERID_UUID_NAMESPACE;
};
