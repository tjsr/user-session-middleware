import {
  NamespaceUUIDFormatError,
  UUIDNamespaceNotDefinedError
} from "../errors/middlewareErrorClasses.js";

import { DeprecatedFunctionError } from '../utils/testing/types.js';
import { IdNamespace } from '../types.js';
import express from '../express/index.js';
import { validate } from 'uuid';

let USERID_UUID_NAMESPACE: IdNamespace | undefined = process.env['USERID_UUID_NAMESPACE'];
// || 'd850e0d9-a02c-4a25-9ade-9711b942b8ba';
const USER_ID_NAMESPACE_KEY = 'USERID_UUID_NAMESPACE';

export const setAppUserIdNamespace = (app: express.Application, namespace: IdNamespace): IdNamespace => {
  if (app === undefined || namespace === undefined) {
    throw new Error(
      'setUserIdNamespace requires an express app and a namespace, with old ' +
        'call giving just namespace being deprecated.'
    );
  }

  if (namespace === undefined) {
    throw new UUIDNamespaceNotDefinedError();
  }
  if (!validate(namespace)) {
    throw new NamespaceUUIDFormatError(namespace);
  }

  app.set(USER_ID_NAMESPACE_KEY, namespace);
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
    process.env['USERID_UUID_NAMESPACE'] === 'undefined' ? undefined : process.env['USERID_UUID_NAMESPACE'];

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

export const getAppUserIdNamespace = (app: express.Application): IdNamespace => {
  const namespaceValue = app.get(USER_ID_NAMESPACE_KEY);

  if (!namespaceValue) {
    throw new UUIDNamespaceNotDefinedError();
  }
  return namespaceValue;
};

export const getUserIdNamespace = (): IdNamespace => {
  console.trace('getUserIdNamespace', 'Deprecated - do not use.');
  throw new DeprecatedFunctionError('getUserIdNamespace');
};
