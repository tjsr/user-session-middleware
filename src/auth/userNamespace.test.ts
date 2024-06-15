import { beforeEach, describe, expect, test } from 'vitest';
import { getUserIdNamespace, setUserIdNamespace } from './userNamespace.js';

import { UUIDNamespaceNotDefinedError } from '../errors/middlewareErrorClasses.js';
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

  test('Should throw an error if no namespace is set.', () => {
    delete process.env['USERID_UUID_NAMESPACE'];
    setUserIdNamespace(undefined!);
    expect(() => getUserIdNamespace()).toThrowError(expect.any(UUIDNamespaceNotDefinedError));
  });
});
