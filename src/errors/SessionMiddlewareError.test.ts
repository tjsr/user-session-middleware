import { SessionMiddlewareError } from './SessionMiddlewareError.ts';

describe('SessionMiddlewareError', () => {
  const testSessionError = new SessionMiddlewareError('Test message');
  test('Should get a http status code corresponding to the sessionErrorCode when constructor has undefined value', () => {
    expect(testSessionError.message).toEqual('Test message');
  });

  test('Name of simple SessionMiddlewareError should have no extension', () => {
    expect(testSessionError.name).toBe('SessionMiddlewareError');
  });

  test('Should verify type is an instance of SessionHandlerError', () => {
    expect(SessionMiddlewareError.isType(testSessionError)).toBe(true);
  });

  test('Should have a stack trace on a basic error object', () => {
    expect(testSessionError.stack).toBeDefined();
  });
});

describe('Inherited SessionHandlerError', () => {
  class TestError extends SessionMiddlewareError {
    constructor(message: string) {
      super(message);
    }
  }

  const testError: TestError = new TestError('Test error message');

  test('Name of extended SessionHandlerError should have no extension', () => {
    expect(testError.name).toBe('TestError:SessionMiddlewareError');
  });

  test('Should verify type is an instance of SessionHandlerError', () => {
    expect(SessionMiddlewareError.isType(testError)).toBe(true);
  });

  test('Should have a stack trace on a basic error object', () => {
    expect(testError.stack).toBeDefined();
  });
});
