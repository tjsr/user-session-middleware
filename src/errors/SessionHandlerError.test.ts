import { describe, expect, test } from 'vitest';

import { NO_SESSION_DATA_FROM_STORE } from './errorCodes';
import { SessionHandlerError } from './SessionHandlerError';

describe('SessionHandlerError', () => {
  const testError = new SessionHandlerError(NO_SESSION_DATA_FROM_STORE, undefined, 'Test message');
  test(
    'Should get a http status code corresponding to the sessionErrorCode when constructor has undefined value',
    () => {
      expect(testError.status).toBe(401);
    });

  test('Name of simple SessionHandlerError should have no extension', () => {
    expect(testError.name).toBe('SessionHandlerError');
  });

  test('Should verify type is an instance of SessionHandlerError', () => {
    expect(SessionHandlerError.isType(testError)).toBe(true);
  });

});

describe('Inherited SessionHandlerError', () => {
  class TestError extends SessionHandlerError {
    constructor(message: string) {
      super(NO_SESSION_DATA_FROM_STORE, undefined, message);
    }
  }

  test('Name of extended SessionHandlerError should have no extension', () => {
    const error = new TestError('Test error message');
    expect(error.name).toBe('TestError:SessionHandlerError');
  });

  test('Should verify type is an instance of SessionHandlerError', () => {
    const error = new TestError('Test error message');
    expect(SessionHandlerError.isType(error)).toBe(true);
  });
});
