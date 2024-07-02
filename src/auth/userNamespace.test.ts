import { NamespaceUUIDFormatError, UUIDNamespaceNotDefinedError } from '../errors/middlewareErrorClasses.js';
import { getUserIdNamespace, setUserIdNamespace } from './userNamespace.js';

import { v5 } from 'uuid';

const nilUuid = '00000000-0000-0000-0000-000000000000';

describe('getUserIdNamespace', () => {
  const initialEnvNamespace = v5('getUserIdNamespace.env', nilUuid);
  const initialSetNamespace = v5('getUserIdNamespace.set', nilUuid);
  beforeEach(() => {
    process.env['USERID_UUID_NAMESPACE'] = initialEnvNamespace;
    setUserIdNamespace(initialSetNamespace);
  });

  test('Should get namespace from environment when no explicit value is set.', () => {
    setUserIdNamespace(undefined!);

    const testNamespace = getUserIdNamespace();
    expect(testNamespace).toBe(initialEnvNamespace);
  });

  test('Should get namespace from set value not environment when environment when value is explicitly set.', () => {
    const testNamespace = getUserIdNamespace();
    expect(testNamespace).toBe(initialSetNamespace);
  });

  test('Should get namespace from set value when environment value is not set.', () => {
    delete process.env['USERID_UUID_NAMESPACE'];
    const testNamespace = getUserIdNamespace();
    expect(testNamespace).toBe(initialSetNamespace);
  });

  test('Should set namespace back to env value if namespace value sets it to undefined.', () => {
    const alternateEnvNamespace = v5('getUserIdNamespace.envAlternate', nilUuid);
    process.env['USERID_UUID_NAMESPACE'] = alternateEnvNamespace;

    setUserIdNamespace(undefined!);
    const testNamespace = getUserIdNamespace();
    expect(testNamespace).toBe(alternateEnvNamespace);
  });
});

describe('setUserIdNamespace', () => {
  test('Should reject a namespace parameter which is not a valid UUID.', () => {
    const invalidNamespace = 'not-a-valid-uuid';
    expect(() => setUserIdNamespace(invalidNamespace)).toThrowError(expect.any(NamespaceUUIDFormatError));
  });

  test('Should reject a namespace on the environment which is not a valid UUID.', () => {
    process.env['USERID_UUID_NAMESPACE'] = 'not-a-valid-uuid';
    expect(() => setUserIdNamespace(undefined!)).toThrowError(expect.any(NamespaceUUIDFormatError));
  });

  test('Should throw an error if trying to set an undefined namespace.', () => {
    process.env['USERID_UUID_NAMESPACE'] = undefined;
    expect(() => setUserIdNamespace(undefined!)).toThrowError(expect.any(UUIDNamespaceNotDefinedError));
  });
});
