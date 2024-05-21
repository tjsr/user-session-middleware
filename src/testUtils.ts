import * as Express from "express";

import { Mock, vi } from "vitest";
import { SystemHttpRequestType, SystemSessionDataType } from "./types";
import { getMockReq, getMockRes } from "vitest-mock-express";

import { MockRequest } from "vitest-mock-express/dist/src/request";

export const getMockResResp = (values?: MockRequest | undefined) => {
  // @ts-expect-error TS6311
  const { clearMockRes, next, res, _mockClear } = getMockRes<Express.Response>();
  const req = getMockReq<SystemHttpRequestType<SystemSessionDataType>>(values);
  const clearMockReq = () => {
    console.debug('TODO: Clearing request mock is not yet implemented.');
  };

  const clear = () => {
    clearMockReq();
    clearMockRes();
    // TODO: Clear response mocks
  };
  
  return { clearMockReq, clearMockRes, mockClear: clear, next, req, res };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMockPromisePair = (template: any): [Promise<void>, Mock] => {
  type CalledMethodType = typeof template;
  type Params = Parameters<CalledMethodType>; // The parameters of the method
  type Return = ReturnType<CalledMethodType>; // The return type of the method

  let resolver: (_value: void | PromiseLike<void>) => void;
  const promise = new Promise<void>((resolve: (_value: void | PromiseLike<void>) => void) => {
    resolver = resolve;
  });

  const mock:Mock = vi.fn<Params, Return>((...args: Params): Return => {
    if (resolver) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver(args as any);
    }
    return template as unknown as Return;
  });
  return [promise, mock];
};
