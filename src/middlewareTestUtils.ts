import { Assertion } from 'vitest';
import { MockRequest } from 'vitest-mock-express/dist/src/request';
import { SessionHandlerError } from './errors/SessionHandlerError.js';
import { SystemHttpRequestType } from './types/request.js';
import { SystemHttpResponseType } from './types/response.js';
import { UserSessionData } from './types/session.js';
import { UserSessionMiddlewareRequestHandler } from './types/middlewareHandlerTypes.js';
import express from 'express';
import { getMockReqResp } from './testUtils.js';

// export type HandlerFunction = <RequestType extends SystemHttpRequestType<SystemSessionDataType>>(
//   _req: RequestType, _res: express.Response, _next: express.NextFunction
// ) => void;
export type HandlerFunction = UserSessionMiddlewareRequestHandler;

type ParamsWrapper = {
  params?: unknown;
};

export type HandlerExpectionResult = {
  expected: Assertion<express.NextFunction>;
  next: express.NextFunction;
  nextParams: ParamsWrapper;
  response: express.Response;
};

export type HandlerErrorResult = {
  error: SessionHandlerError;
  next: express.NextFunction;
  response: express.Response;
};

const expectVerifyHandlerFunction = <
  RequestType extends SystemHttpRequestType<UserSessionData>,
  ResponseType extends SystemHttpResponseType<UserSessionData>
  >(
    handlerFunction: HandlerFunction,
    mockRequest = {} as Partial<RequestType>,
    mockRespose = {} as Partial<ResponseType>
  ): HandlerExpectionResult => {
  const { request, response, next } = getMockReqResp<RequestType>(
    { ...mockRequest } as MockRequest,
    { ...mockRespose } as Partial<ResponseType>
  );

  const paramsWrapper: ParamsWrapper = {};

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

export const verifyHandlerFunctionCallsNextWithError = <
  RequestType extends SystemHttpRequestType<UserSessionData>,
  ResponseType extends SystemHttpResponseType<UserSessionData>,
>(
    handlerFunction: HandlerFunction,
    mockRequest = {} as Partial<RequestType>,
    mockResponse = {} as Partial<ResponseType>,
    expectNextArgs = expect.any(SessionHandlerError)
  ): HandlerErrorResult => {
  const { response, expected, next, nextParams } = expectVerifyHandlerFunction(
    handlerFunction, mockRequest, mockResponse);
  expected.toBeCalledWith(expectNextArgs);

  const error: SessionHandlerError = nextParams.params as unknown as SessionHandlerError;

  return { error, next, response };
};

export const verifyHandlerFunctionCallsNext = <
  RequestType extends SystemHttpRequestType,
  ResponseType extends SystemHttpResponseType,
>(
    handlerFunction: HandlerFunction,
    mockRequest = {} as Partial<RequestType>,
    mockResponse = {} as Partial<ResponseType>
  ): express.Response => {
  const { response, expected } = expectVerifyHandlerFunction(handlerFunction, mockRequest, mockResponse);
  expected.toBeCalledWith();
  return response;
};
