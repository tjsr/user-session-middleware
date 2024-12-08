import { HttpStatusCode } from '../httpStatusCodes.js';
import { NO_SESSION_DATA_FROM_STORE } from './errorCodes.js';
import { SessionHandlerError } from './SessionHandlerError.js';

describe('SessionHandlerError', () => {
  const testSessionError = new SessionHandlerError(NO_SESSION_DATA_FROM_STORE, undefined, 'Test message');
  test('Should get a http status code corresponding to the sessionErrorCode when constructor has undefined value', () => {
    expect(testSessionError.status).toBe(HttpStatusCode.UNAUTHORIZED);
  });

  test('Name of simple SessionHandlerError should have no extension', () => {
    expect(testSessionError.name).toBe('SessionHandlerError');
  });

  test('Should verify type is an instance of SessionHandlerError', () => {
    expect(SessionHandlerError.isType(testSessionError)).toBe(true);
  });

  test('Should have a stack trace on a basic error object', () => {
    expect(testSessionError.stack).toBeDefined();
  });
});

describe('Inherited SessionHandlerError', () => {
  class TestError extends SessionHandlerError {
    constructor(message: string) {
      super(NO_SESSION_DATA_FROM_STORE, undefined, message);
    }
  }

  const testError: TestError = new TestError('Test error message');

  test('Name of extended SessionHandlerError should have no extension', () => {
    expect(testError.name).toBe('TestError:SessionHandlerError');
  });

  test('Should verify type is an instance of SessionHandlerError', () => {
    expect(SessionHandlerError.isType(testError)).toBe(true);
  });

  test('Should have a stack trace on a basic error object', () => {
    expect(testError.stack).toBeDefined();
  });
});
