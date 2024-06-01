import { Mock, MockInstance, expect, vi } from "vitest";
import { SessionStoreDataType, SystemHttpRequestType, SystemHttpResponse, SystemSessionDataType } from "./types";
import { endErrorRequest, endRequest, sessionErrorHandler } from "./middleware/sessionErrorHandler";
import { getMockReq, getMockRes } from "vitest-mock-express";
import session, { Cookie, Store } from "express-session";

import { MockRequest } from "vitest-mock-express/dist/src/request";
import express from "express";
import expressSession from "express-session";
import { sessionHandlerMiddleware } from "./getSession";

export interface MockReqRespSet<
  RequestType extends SystemHttpRequestType<SystemSessionDataType> = SystemHttpRequestType<SystemSessionDataType>,
  ResponseType extends SystemHttpResponse<SessionStoreDataType> = SystemHttpResponse<SessionStoreDataType>
> {
  clearMockReq: () => void;
  clearMockRes: () => void;
  mockClear: () => void;
  next: express.NextFunction;
  request: RequestType;
  response: ResponseType;
  spies?: Map<Function, MockInstance>;
};

export interface SessionDataTestContext {
  memoryStore?: Store;
  testRequestData: MockRequest;
  testSessionStoreData: SystemSessionDataType;
}

declare module 'vitest' {
  export interface TestContext {
    memoryStore?: Store;
    testRequestData: MockRequest;
    testSessionStoreData: SystemSessionDataType;
  }
};

export const getMockReqResp = <
  RequestType extends SystemHttpRequestType<SystemSessionDataType> = SystemHttpRequestType<SystemSessionDataType>,
  ResponseType extends SystemHttpResponse<SessionStoreDataType> = SystemHttpResponse<SessionStoreDataType>
>(values?: MockRequest | undefined): MockReqRespSet => {
  // @ts-expect-error TS6311
  const { clearMockRes, next, res: response, _mockClear } = getMockRes<ResponseType>();
  const request: RequestType = getMockReq(values);
  const clearMockReq = () => {
    console.debug('TODO: Clearing request mock is not yet implemented.');
  };

  const clear = () => {
    clearMockReq();
    clearMockRes();
    // TODO: Clear response mocks
  };
  
  return { clearMockReq, clearMockRes, mockClear: clear, next, request, response };
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

const addExpressSessionHandler = (app: express.Express, memoryStore: session.MemoryStore): void => {
  app.use(sessionHandlerMiddleware(memoryStore));
};

const addHandlersToApp = (
  app: express.Express,
  middleware: express.RequestHandler[],
  endMiddleware?: express.RequestHandler[]
): void => {
  app.use(middleware);
  app.get('/', (req, res, next) => {
    res.status(200);
    next();
  });
  if (endMiddleware) {
    app.use(endMiddleware);
  }
  app.use(sessionErrorHandler);
  app.use(endRequest);
  app.use(endErrorRequest);
};

export const sessionlessAppWithMiddleware = (
  middleware: express.RequestHandler[],
  endMiddleware?: express.RequestHandler[]
): { app: express.Express, memoryStore: session.MemoryStore } => {

  const app: express.Express = express();
  addHandlersToApp(app, middleware, endMiddleware);

  return { app, memoryStore: undefined! };
};

export const appWithMiddleware = (
  middleware: express.RequestHandler[],
  endMiddleware?: express.RequestHandler[]
): { app: express.Express, memoryStore: session.MemoryStore } => {
  const memoryStore: session.MemoryStore = new session.MemoryStore();

  const app: express.Express = express();
  addExpressSessionHandler(app, memoryStore);
  addHandlersToApp(app, middleware, endMiddleware);

  return { app, memoryStore };
};

interface SessionTestRunOptions {
  noMockSave?: boolean;
  skipCreateSession?: boolean;
  skipAddToStore?: boolean;
  spyOnSave?: boolean;
  overrideSessionData?: Partial<SystemSessionDataType>;
}

export const createTestRequestSessionData = (
  context: SessionDataTestContext, 
  mockDataOverrides: MockRequest = {},
  testRunOptions: SessionTestRunOptions = {} 
): {  } & MockReqRespSet => {
  const mockRequestData: MockRequest = {
    ...context.testRequestData,
    ...mockDataOverrides,
  };
  const mocks: MockReqRespSet = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>(mockRequestData);
  const { request } = mocks;
  context.testRequestData.new = true;
  if (mockRequestData.sessionID && !testRunOptions.skipAddToStore) {
    context.memoryStore?.set(mockRequestData.sessionID, context.testSessionStoreData);
  }
  if (!testRunOptions.skipCreateSession) {
    request.sessionStore.createSession(request, context.testSessionStoreData);
    if (testRunOptions.spyOnSave) {
      if (mocks.spies === undefined) {
        mocks.spies = new Map();
      }
      const saveSpy = vi.spyOn(request.session, 'save');
      mocks.spies.set(request.session.save, saveSpy);
    } else if (!testRunOptions.noMockSave) {
      request.session.save = vi.fn();
    }

    expect(request.session).toBeDefined();

    if (testRunOptions.overrideSessionData !== undefined) {
      Object.keys(testRunOptions?.overrideSessionData as object).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (request.session as any)[key] = testRunOptions.overrideSessionData![key];
      });
    }
  }

  return mocks;
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
