import { IdNamespace } from "../types.js";
import { UUIDNamespaceNotDefinedError } from "../errors/middlewareErrorClasses.js";
import { loadEnv } from "@tjsr/simple-env-utils";

loadEnv();

let USERID_UUID_NAMESPACE: IdNamespace|undefined = process.env['USERID_UUID_NAMESPACE'];
// || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

export const setUserIdNamespace = (namespace: IdNamespace): void => {
  if (namespace === undefined) {
    USERID_UUID_NAMESPACE = process.env['USERID_UUID_NAMESPACE'];
  }
  USERID_UUID_NAMESPACE = namespace;
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
