import { Mock, vi } from "vitest";
import { SystemHttpRequestType, SystemSessionDataType } from "./types";
import { getMockReq, getMockRes } from "vitest-mock-express";
import session, { Cookie, Store } from "express-session";

import { MockRequest } from "vitest-mock-express/dist/src/request";
import express from "express";
import expressSession from "express-session";
import { sessionErrorHandler } from "./middleware/sessionErrorHandler";
import { sessionHandlerMiddleware } from "./getSession";

export interface MockReqRespSet<
  RequestType extends express.Request = SystemHttpRequestType<SystemSessionDataType>,
  ResponseType extends express.Response = express.Response
> {
  clearMockReq: () => void;
  clearMockRes: () => void;
  mockClear: () => void;
  next: express.NextFunction;
  request: RequestType;
  response: ResponseType;
};

export interface SessionDataTestContext {
  memoryStore?: Store;
  testRequestData: MockRequest;
  testSessionStoreData: SystemSessionDataType;
}

export const getMockReqResp = <
  RequestType extends express.Request = SystemHttpRequestType<SystemSessionDataType>,
  ResponseType extends express.Response = express.Response
>(values?: MockRequest | undefined): MockReqRespSet => {
  // @ts-expect-error TS6311
  const { clearMockRes, next, res, _mockClear } = getMockRes<ResponseType>();
  const request: RequestType = getMockReq(values);
  const clearMockReq = () => {
    console.debug('TODO: Clearing request mock is not yet implemented.');
  };

  const clear = () => {
    clearMockReq();
    clearMockRes();
    // TODO: Clear response mocks
  };
  
  return { clearMockReq, clearMockRes, mockClear: clear, next, request, response: res };
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

export const appWithMiddleware = (
  ...middleware: express.RequestHandler[]
): { app: express.Express, memoryStore: session.MemoryStore } => {
  const memoryStore: session.MemoryStore = new session.MemoryStore();

  const app: express.Express = express();
  app.use(sessionHandlerMiddleware(memoryStore));
  app.use(middleware);
  app.get('/', (req, res, _next) => {
    res.status(200);
    res.end();
  });
  app.use(sessionErrorHandler);
  return { app, memoryStore };
};

export const createTestRequestSessionData = (
  context: SessionDataTestContext, 
  mockDataOverrides: MockRequest  = {},
  { 
    noMockSave = false,
    skipCreateSession = false,
  }
): {  } & MockReqRespSet => {
  const mocks = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>(
    {
      ...context.testRequestData,
      ...mockDataOverrides,
    }
  );
  const { request } = mocks;
  context.testRequestData.new = true;
  if (!skipCreateSession) {
    request.sessionStore.createSession(request, context.testSessionStoreData);
  }
  if (!noMockSave) {
    request.session.save = vi.fn();
  }

  return { ...mocks };
};

export const createContextForSessionTest = (
  context: SessionDataTestContext,
  requestDataDefaults: MockRequest = {},
  sessionStoreDefaults: Partial<SystemSessionDataType> = {}
): void => {
  const cookie = new Cookie();
  context.memoryStore = new expressSession.MemoryStore();
  context.memoryStore.set('some-session-id', {
    cookie,
  });

  context.testRequestData = {
    newSessionIdGenerated: requestDataDefaults.newSessionIdGenerated !== undefined
      ? requestDataDefaults.newSessionIdGenerated : false,
    sessionID: requestDataDefaults.sessionID !== undefined ? requestDataDefaults.sessionID : undefined,
    sessionStore: context.memoryStore,
  };

  context.testSessionStoreData = {
    cookie,
    email: sessionStoreDefaults.email !== undefined ? sessionStoreDefaults.email : "test-email",
    newId: undefined,
    userId: sessionStoreDefaults.userId !== undefined ? sessionStoreDefaults.userId : 'test-user-id',
  };
};
