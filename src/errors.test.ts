import { NO_SESSION_DATA_FROM_STORE, SessionHandlerError } from './errors.js';
import { describe, expect, test } from 'vitest';

describe('SessionHandlerError', () => {
  test(
    'Should get a http status code corresponding to the sessionErrorCode when constructor has undefined value',
    () => {
      const error = new SessionHandlerError(NO_SESSION_DATA_FROM_STORE, undefined, 'Test message');
      expect(error.status).toBe(401);
    });
});
