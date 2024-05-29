import { Assertion, expect, vi } from "vitest";
import { SystemHttpRequestType, SystemSessionDataType } from "./types";

import { MockRequest } from "vitest-mock-express/dist/src/request";
import { SessionHandlerError } from "./errors";
import express from "express";
import { getMockReqResp } from "./testUtils";

export type HandlerFunction = <RequestType extends SystemHttpRequestType<SystemSessionDataType>>(
  _req: RequestType, _res: express.Response, _next: express.NextFunction
) => void;

type ParamsWrapper = {
  params?: unknown;
};

export type HandlerExpectionResult = {
  response: express.Response;
  expected: Assertion<express.NextFunction>;
  next: express.NextFunction;
  nextParams: ParamsWrapper;
};

export type HandlerErrorResult = {
  response: express.Response;
  error: SessionHandlerError;
  next: express.NextFunction;
};

const expectVerifyHandlerFunction = <RequestType extends SystemHttpRequestType<SystemSessionDataType>>(
  handlerFunction: HandlerFunction,
  mockRequest = {} as Partial<RequestType>
): HandlerExpectionResult => {
  const { request, response, next } = getMockReqResp<RequestType>(
    { ...mockRequest } as MockRequest
  );

  const paramsWrapper: ParamsWrapper = { };
  
  const result: Partial<HandlerExpectionResult> = {
    next,
    nextParams: paramsWrapper,
    response,
  };
  const mockNext = vi.fn((params: unknown) => {
    if (params) {
      result.nextParams!.params = params;
      next(params);
    } else {
      next();
    }
  });

  handlerFunction(request, response, mockNext);
  result.expected = expect(next);

  return result as HandlerExpectionResult;
};

export const verifyHandlerFunctionCallsNextWithError = 
<RequestType extends SystemHttpRequestType<SystemSessionDataType>>(
    handlerFunction: HandlerFunction,
    mockRequest = {} as Partial<RequestType>,
    expectNextArgs = expect.any(SessionHandlerError)
  ): HandlerErrorResult => {
  const { response, expected, next, nextParams } = expectVerifyHandlerFunction(handlerFunction, mockRequest);
  expected.toBeCalledWith(expectNextArgs);
  
  const error: SessionHandlerError = nextParams.params as unknown as SessionHandlerError;

  return { error, next, response };
};

export const verifyHandlerFunctionCallsNext = 
<RequestType extends SystemHttpRequestType<SystemSessionDataType>>(
    handlerFunction: HandlerFunction,  mockRequest = {} as Partial<RequestType>
  ): express.Response => {
  const { response, expected } = expectVerifyHandlerFunction(handlerFunction, mockRequest);
  expected.toBeCalledWith();
  return response;
};
