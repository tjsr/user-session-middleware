import { SessionStoreDataType, SystemHttpResponseType } from '../types.js';
import { describe, expect, test } from 'vitest';

import { HttpStatusCode } from '../httpStatusCodes.js';
import { endWithJsonMessage } from './apiMiddlewareUtils.js';
import { getMockRes } from 'vitest-mock-express';

describe('endWithJsonMessage', () => {
  test('should call next and not reject or end chain when next parameter is passed.', async () => {
    const { res, next } = getMockRes<SystemHttpResponseType<SessionStoreDataType>>();

    await expect(endWithJsonMessage(res, 401, 'Unauthorized', next)).resolves.not.toThrow();
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
    expect(res.send).toBeCalledWith({ message: 'Unauthorized' });
    expect(next).toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
    expect(res.contentType).toHaveBeenCalledWith('application/json');
  });

  test('should end chain when no next parameter is passed.', async () => {
    const { res, next } = getMockRes<SystemHttpResponseType<SessionStoreDataType>>();

    await expect(endWithJsonMessage(res, HttpStatusCode.FORBIDDEN, 'Forbidden')).resolves.not.toThrow();
    // .toEqual(new Error('403/Forbidden'));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toBeCalledWith({ message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalled();
    expect(res.contentType).toHaveBeenCalledWith('application/json');
  });
});
