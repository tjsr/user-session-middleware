import express, { NextFunction } from '../../../express/index.ts';

import { MockResponse } from 'vitest-mock-express/dist/src/response/index.js';
import { SystemHttpResponseType } from '../../../types/response.ts';
import { TaskContext } from 'vitest';
import { UserSessionData } from '../../../types/session.ts';
import { getMockRes } from 'vitest-mock-express';

export type ResponseContext<Response extends express.Response = SystemHttpResponseType<UserSessionData>> =
  TaskContext & {
    clearMockRes: () => void;
    next: NextFunction;
    response: Response;
  };

export const setupResponseContext = <ResponseType extends express.Response>(
  context: TaskContext,
  responseData?: MockResponse | undefined
): ResponseContext<ResponseType> => {
  const responseContext: ResponseContext<ResponseType> = context as unknown as ResponseContext<ResponseType>;
  const { clearMockRes, next, res } = getMockRes<ResponseType>(responseData);
  responseContext.response = res;
  responseContext.clearMockRes = clearMockRes;
  responseContext.next = next;
  return responseContext;
};
