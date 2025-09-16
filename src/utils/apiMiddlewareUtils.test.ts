import { HttpStatusCode } from '../httpStatusCodes.ts';
import { SystemHttpResponseType } from '../types/response.ts';
import { UserSessionData } from '../types/session.ts';
import { endWithJsonMessage } from './apiMiddlewareUtils.ts';
import { getMockRes } from 'vitest-mock-express';

describe('endWithJsonMessage', () => {
  test('should call next and not reject or end chain when next parameter is passed.', async () => {
    const { res, next } = getMockRes<SystemHttpResponseType<UserSessionData>>();

    await expect(endWithJsonMessage(res, HttpStatusCode.UNAUTHORIZED, 'Unauthorized', next)).resolves.not.toThrow();
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
    expect(res.send).toBeCalledWith({ message: 'Unauthorized' });
    expect(next).toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
    expect(res.contentType).toHaveBeenCalledWith('application/json');
  });

  test('should end chain when no next parameter is passed.', async () => {
    const { res, next } = getMockRes<SystemHttpResponseType<UserSessionData>>();

    await expect(endWithJsonMessage(res, HttpStatusCode.FORBIDDEN, 'Forbidden')).resolves.not.toThrow();
    // .toEqual(new Error('403/Forbidden'));
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.FORBIDDEN);
    expect(res.send).toBeCalledWith({ message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalled();
    expect(res.contentType).toHaveBeenCalledWith('application/json');
  });
});
