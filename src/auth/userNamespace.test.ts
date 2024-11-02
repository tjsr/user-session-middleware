import { getUserIdNamespace, setUserIdNamespace } from './userNamespace.js';

import { DeprecatedFunctionError } from '../utils/testing/types.js';
import { NamespaceUUIDFormatError } from '../errors/middlewareErrorClasses.js';

describe('getUserIdNamespace', () => {
  test('Should not permit calling old getUserIdNamespace function', () => {
    expect(() => getUserIdNamespace()).toThrowError(expect.any(DeprecatedFunctionError));
  });
});

describe('setUserIdNamespace', () => {
  test('Should not permit calling with undefined value', () => {
    expect(() => setUserIdNamespace(undefined!)).toThrowError(expect.any(DeprecatedFunctionError));
  });

  test('Should reject a namespace parameter which is not a valid UUID.', () => {
    const invalidNamespace = 'not-a-valid-uuid';
    expect(() => setUserIdNamespace(invalidNamespace)).toThrowError(expect.any(NamespaceUUIDFormatError));
  });

  test('Should reject a namespace on the environment which is not a valid UUID.', () => {
    process.env['USERID_UUID_NAMESPACE'] = 'not-a-valid-uuid';
    expect(() => setUserIdNamespace(undefined!)).toThrowError(expect.any(DeprecatedFunctionError));
  });

  test('Should throw an error if trying to set an undefined namespace.', () => {
    process.env['USERID_UUID_NAMESPACE'] = undefined;
    expect(() => setUserIdNamespace(undefined!)).toThrowError(expect.any(DeprecatedFunctionError));
  });
});
