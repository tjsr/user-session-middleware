import {
  HandlerName,
  SessionId,
} from "./types.js";
import { Mock, MockInstance, expect, vi } from "vitest";
import { endErrorRequest, endRequest } from "./middleware/handleTestEndEvents.js";
import express, { ErrorRequestHandler, RequestHandler } from "express";
import { getMockReq, getMockRes } from "vitest-mock-express";
import session, { Cookie, Store } from "express-session";

import { MockRequest } from "vitest-mock-express/dist/src/request";
import { SystemHttpRequestType } from "./types/request.js";
import { SystemHttpResponseType } from "./types/response.js";
import { UserSessionData } from "./types/session.js";
import { addCalledHandler } from "./middleware/handlerChainLog.js";
import expressSession from "express-session";
import { expressSessionHandlerMiddleware } from "./getSession.js";
import { sessionErrorHandler } from "./middleware/sessionErrorHandler.js";
import supertest from "supertest";

export interface MockReqRespSet<
  RequestType extends SystemHttpRequestType = SystemHttpRequestType<UserSessionData>,
  ResponseType extends SystemHttpResponseType = SystemHttpResponseType<UserSessionData>
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
  testSessionStoreData: UserSessionData;
}

declare module 'vitest' {
  export interface TestContext {
    memoryStore?: Store;
    testRequestData: MockRequest;
    testSessionStoreData: UserSessionData;
  }
};

export const getMockReqResp = <
RequestType extends SystemHttpRequestType = SystemHttpRequestType<UserSessionData>,
ResponseType extends SystemHttpResponseType = SystemHttpResponseType<UserSessionData>
>(values?: MockRequest | undefined, mockResponseData?: Partial<ResponseType>): MockReqRespSet => {
  // @ts-expect-error TS6311
  const { clearMockRes, next, res: response, _mockClear } = getMockRes<ResponseType>(mockResponseData);
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

export const getMockRequestResponse = getMockReqResp;

export const getMockRequest = getMockReq;
export const getMockResponse = getMockRes;

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
  return [ promise, mock ];
};

const addExpressSessionHandler = (app: express.Express, memoryStore: session.MemoryStore): void => {
  app.use(expressSessionHandlerMiddleware(undefined, memoryStore));
};

const addHandlersToApp = (
  app: express.Express,
  middleware: (express.RequestHandler|express.ErrorRequestHandler)[],
  endMiddleware?: (express.RequestHandler|express.ErrorRequestHandler)[]
): void => {
  app.use(middleware);
  app.get('/', (req, res, next) => {
    res.status(200);
    next();
  });
  if (endMiddleware) {
    app.use(endMiddleware);
  }
  app.use(sessionErrorHandler as ErrorRequestHandler);
  app.use(endRequest as RequestHandler);
  app.use(endErrorRequest as ErrorRequestHandler);
};

export const sessionlessAppWithMiddleware = (
  middleware: (express.RequestHandler|express.ErrorRequestHandler)[],
  endMiddleware?: (express.RequestHandler|express.ErrorRequestHandler)[]
): { app: express.Express, memoryStore: session.MemoryStore } => {

  const app: express.Express = express();
  addHandlersToApp(app, middleware, endMiddleware);

  return { app, memoryStore: undefined! };
};

export const appWithMiddleware = (
  middleware: (express.RequestHandler|express.ErrorRequestHandler)[],
  endMiddleware?: (express.RequestHandler|express.ErrorRequestHandler)[]
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
  overrideSessionData?: Partial<UserSessionData>;
  markHandlersCalled?: HandlerName[],
  silentCallHandlers?: boolean;
}

export const createTestRequestSessionData = (
  context: SessionDataTestContext, 
  mockDataOverrides: MockRequest = {},
  testRunOptions: SessionTestRunOptions = {
    silentCallHandlers: true,
  }
): {  } & MockReqRespSet => {
  if (context.testRequestData === undefined) {
    createContextForSessionTest(context);
  }
  const mockRequestData: MockRequest = {
    ...context.testRequestData,
    ...mockDataOverrides,
  };
  const mocks: MockReqRespSet = getMockReqResp<SystemHttpRequestType<UserSessionData>>(mockRequestData);
  const { request, response } = mocks;
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
  if (testRunOptions.markHandlersCalled) {
    testRunOptions.markHandlersCalled.forEach((handlerName) => {
      addCalledHandler(response, handlerName, testRunOptions.silentCallHandlers);
    });
  }

  return mocks;
};

export const createContextForSessionTest = (
  context: SessionDataTestContext,
  requestDataDefaults: MockRequest = {},
  sessionStoreDefaults: Partial<UserSessionData> = {}
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

export const expectResponseSetsSessionIdCookie = (
  response: supertest.Response, expectedSessionId: SessionId
): void => {
  const cookieValue = response.get('Set-Cookie')![0];
  expect(cookieValue).toMatch(new RegExp(`sessionId=${expectedSessionId}`));
};

export const expectDifferentSetCookieSessionId = (sessionId: SessionId, cookieValue: string): void => {
  expect(cookieValue).not.toMatch(new RegExp(`sessionId=${sessionId}`));
  expect(cookieValue).toMatch(new RegExp(`sessionId=(?!${sessionId}).*; Path=/; HttpOnly; SameSite=Strict`));
};

export const expectSetCookieSessionId = (sessionId: SessionId, cookieValue: string): void => {
  expect(cookieValue).toEqual(`sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Strict`);
};

export const expectResponseResetsSessionIdCookie = (
  response: supertest.Response, originalSessionId: SessionId
) => {
  const cookieValue = response.get('Set-Cookie')![0];
  expectDifferentSetCookieSessionId(originalSessionId, cookieValue);
};

export const checkForDefault = <OptionsType extends object>(
  defaultOptions: OptionsType,
  contextOptions: Partial<OptionsType>,
  key: string,
  defaultOptionsMethod: (_options: Partial<OptionsType>) => OptionsType) => {
  expect(defaultOptions[key]).not.toBeUndefined();
  delete contextOptions[key];
  const updatedOptions = defaultOptionsMethod(contextOptions);
  console.log(`Checking ${key}: ${updatedOptions[key]} === ${defaultOptions[key]}`);
  expect(updatedOptions[key]).toEqual(defaultOptions[key]);
};

export const checkForOverride = <OptionsType extends object>(
  defaultOptions: OptionsType,
  contextOptions: Partial<OptionsType>,
  key: string,
  defaultOptionsMethod: (_options: Partial<OptionsType>) => OptionsType
) => {
  const overrideData: Partial<OptionsType> = {
    [key]: contextOptions[key],
  } as const as Partial<OptionsType>;
  const updatedOptions = defaultOptionsMethod(overrideData);
  console.log(`Checking ${key}: ${updatedOptions[key]} === ${defaultOptions[key]}`);

  if (contextOptions[key] !== defaultOptions[key]) {
    expect(updatedOptions[key], `For ${key} updated value ${updatedOptions[key]} should not match default.`)
      .not.toEqual(defaultOptions[key]);
  };
  expect(updatedOptions[key], `For ${key} updated value ${updatedOptions[key]} should match context`)
    .toEqual(contextOptions[key]);
};
