import express, { NextFunction } from '../../../express/index.ts';

import { MockResponse } from 'vitest-mock-express/dist/src/response/index.js';
import { SystemHttpResponseType } from '../../../types/response.ts';
import { TestContext } from 'vitest';
import { UserSessionData } from '../../../types/session.ts';
import { getMockRes } from 'vitest-mock-express';

export type ResponseContext<Response extends express.Response = SystemHttpResponseType<UserSessionData>> =
  TestContext & {
    clearMockRes: () => void;
    next: NextFunction;
    response: Response;
  };

export const setupResponseContext = <ResponseType extends express.Response>(
  context: TestContext,
  responseData?: MockResponse | undefined
): ResponseContext<ResponseType> => {
  const responseContext: ResponseContext<ResponseType> = context as unknown as ResponseContext<ResponseType>;
  const { clearMockRes, next, res } = getMockRes<ResponseType>(responseData);
  responseContext.response = res;
  responseContext.clearMockRes = clearMockRes;
  responseContext.next = next;
  return responseContext;
};
