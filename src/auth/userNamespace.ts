import {
  NamespaceUUIDFormatError,
  UUIDNamespaceNotDefinedError
} from "../errors/middlewareErrorClasses.js";

import { AppLocals } from '../express/index.js';
import { DeprecatedFunctionError } from '../utils/testing/types.js';
import { IdNamespace } from '../types.js';
import { validate } from 'uuid';

export const USER_ID_NAMESPACE_KEY = 'USERID_UUID_NAMESPACE';
let USERID_UUID_NAMESPACE: IdNamespace | undefined = process.env[USER_ID_NAMESPACE_KEY];
// || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';

export const setAppUserIdNamespace = (appLocals: AppLocals, namespace: IdNamespace): IdNamespace => {
  if (appLocals === undefined || namespace === undefined) {
    throw new Error(
      'setUserIdNamespace requires an express app locals and a namespace, with old ' +
        'call giving just namespace being deprecated.'
    );
  } else if (!appLocals) {
    throw new Error('setUserIdNamespace requires an express app with locals.');
  }

  if (namespace === undefined) {
    throw new UUIDNamespaceNotDefinedError();
  }
  if (!validate(namespace)) {
    throw new NamespaceUUIDFormatError(namespace);
  }

  appLocals[USER_ID_NAMESPACE_KEY] = namespace;
  return namespace;
};

export const setUserIdNamespace = (namespace: IdNamespace): IdNamespace => {
  if (namespace === undefined) {
    throw new DeprecatedFunctionError(
      'setUserIdNamespace',
      undefined,
      'Use of setUserIdNamespace with undefined namespace is now deprecated and should set this value on app instead.'
    );
  }
  const envNamespace: IdNamespace | undefined =
    process.env[USER_ID_NAMESPACE_KEY] === 'undefined' ? undefined : process.env[USER_ID_NAMESPACE_KEY];

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

export const getAppUserIdNamespace = (appLocals: AppLocals): IdNamespace => {
  if (appLocals === undefined) {
    throw new Error('getAppUserIdNamespace requires an express app locals object.');
  }

  const namespaceValue = appLocals[USER_ID_NAMESPACE_KEY];

  if (!namespaceValue) {
    throw new UUIDNamespaceNotDefinedError();
  }
  return namespaceValue as IdNamespace;
};

export const getUserIdNamespace = (): IdNamespace => {
  console.trace('getUserIdNamespace', 'Deprecated - do not use.');
  throw new DeprecatedFunctionError('getUserIdNamespace');
};
