import { getMockRes } from 'vitest-mock-express';

import { HttpStatusCode } from '../httpStatusCodes.ts';
import { endWithJsonMessage } from './apiMiddlewareUtils.ts';
import { SystemHttpResponseType } from '../types/response.ts';
import { UserSessionData } from '../types/session.ts';

describe('endWithJsonMessage', () => {
  test('finishes the handled response without calling next when a callback is provided.', async () => {
    const { res, next } = getMockRes<SystemHttpResponseType<UserSessionData>>();

    await expect(endWithJsonMessage(res, HttpStatusCode.UNAUTHORIZED, 'Unauthorized', next)).resolves.not.toThrow();
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.UNAUTHORIZED);
    expect(res.send).toBeCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
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
    expect(res.end).not.toHaveBeenCalled();
    expect(res.contentType).toHaveBeenCalledWith('application/json');
  });
});

test('delegates errors when response headers have already been sent', async () => {
  const { res, next } = getMockRes<SystemHttpResponseType<UserSessionData>>({ headersSent: true });
  await endWithJsonMessage(res, HttpStatusCode.FORBIDDEN, 'Forbidden', next);
  expect(next).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ message: '403/Forbidden' }));
  expect(res.send).not.toHaveBeenCalled();
});

test('rejects an already-sent response when there is no next callback', async () => {
  const { res } = getMockRes<SystemHttpResponseType<UserSessionData>>({ headersSent: true });
  await expect(endWithJsonMessage(res, HttpStatusCode.FORBIDDEN, 'Forbidden')).rejects.toThrow('403/Forbidden');
  expect(res.send).not.toHaveBeenCalled();
});

test('forwards an unexpected send failure without replacing the error', async () => {
  const { res, next } = getMockRes<SystemHttpResponseType<UserSessionData>>();
  const failure = new Error('send failure fixture');
  vi.mocked(res.send).mockImplementation(() => {
    throw failure;
  });
  await endWithJsonMessage(res, HttpStatusCode.FORBIDDEN, 'Forbidden', next);
  expect(next).toHaveBeenCalledExactlyOnceWith(failure);
});
