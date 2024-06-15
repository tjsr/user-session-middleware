import { Cookie, MemoryStore, SessionData, Store } from './express-session/index.js';
import { Mock, MockInstance, expect, vi } from "vitest";
import { endErrorRequest, endRequest } from "./middleware/handleTestEndEvents.js";
import express, { ErrorRequestHandler, Express, NextFunction, RequestHandler } from './express/index.js';
import { getMockReq, getMockRes } from "vitest-mock-express";

import {
  HandlerName,
} from "./types.js";
import { HttpStatusCode } from "./httpStatusCodes.js";
import { MockRequest } from "vitest-mock-express/dist/src/request";
import { SystemHttpRequestType } from "./types/request.js";
import { SystemHttpResponseType } from "./types/response.js";
import { UserSessionData } from "./types/session.js";
import { expressSessionHandlerMiddleware } from "./getSession.js";
import { markHandlersCalled } from "./utils/testing/markHandlers.js";
import { sessionErrorHandler } from "./middleware/sessionErrorHandler.js";

export interface MockReqRespSet<
  RequestType extends SystemHttpRequestType = SystemHttpRequestType<UserSessionData>,
  ResponseType extends SystemHttpResponseType = SystemHttpResponseType<UserSessionData>
> {
  clearMockReq: () => void;
  clearMockRes: () => void;
  mockClear: () => void;
  next: NextFunction;
  request: RequestType;
  response: ResponseType;
  spies?: Map<Function, MockInstance>;
};

export interface SessionDataTestContext {
  memoryStore?: Store;
  testRequestData: MockSessionRequest;
  testSessionStoreData: UserSessionData;
}

declare module 'vitest' {
  export interface TestContext {
    memoryStore?: Store;
    testRequestData: MockSessionRequest;
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

const addExpressSessionHandler = (app: Express, memoryStore: MemoryStore): void => {
  app.use(expressSessionHandlerMiddleware(undefined, memoryStore));
};

type MiddlewareTypes = (RequestHandler | ErrorRequestHandler)[];

const addHandlersToApp = (
  app: Express,
  middleware: (RequestHandler|ErrorRequestHandler)[],
  endMiddleware?: (RequestHandler|ErrorRequestHandler)[]
): void => {
  app.use(middleware);
  app.get('/', (_req, res, next) => {
    res.status(HttpStatusCode.OK);
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
  middleware: MiddlewareTypes,
  endMiddleware?: MiddlewareTypes
): { app: Express, memoryStore: MemoryStore } => {

  const app: Express = express();
  addHandlersToApp(app, middleware, endMiddleware);

  return { app, memoryStore: undefined! };
};

export const appWithMiddleware = (
  middleware: MiddlewareTypes,
  endMiddleware?: MiddlewareTypes
): { app: Express, memoryStore: MemoryStore } => {
  const memoryStore: MemoryStore = new MemoryStore();

  const app: Express = express();
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
  mockDataOverrides: MockSessionRequest = {},
  testRunOptions: SessionTestRunOptions = {
    silentCallHandlers: true,
  }
): {  } & MockReqRespSet => {
  if (context.testRequestData === undefined) {
    createContextForSessionTest(context);
  }
  const mockRequestData: MockSessionRequest = {
    ...context.testRequestData,
    ...mockDataOverrides,
  };
  const mocks: MockReqRespSet = getMockReqResp<SystemHttpRequestType<UserSessionData>>(mockRequestData);
  const { request, response } = mocks;
  context.testRequestData['newSessionIdGenerated'] = true;
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

    Object.assign(request.session, testRunOptions.overrideSessionData);
  }
  if (testRunOptions.markHandlersCalled) {
    markHandlersCalled(response, testRunOptions.markHandlersCalled, testRunOptions.silentCallHandlers);
  }

  return mocks;
};

export interface MockSessionRequest extends MockRequest {
  sessionID?: string | undefined;
  newSessionIdGenerated?: boolean | undefined;
  sessionStore?: Store | undefined;
}

export const createContextForSessionTest = (
  context: SessionDataTestContext,
  requestDataDefaults: MockSessionRequest = {},
  sessionStoreDefaults: Partial<UserSessionData> = {}
): void => {
  const cookie = new Cookie();
  context.memoryStore = new MemoryStore();
  context.memoryStore?.set('some-session-id', {
    cookie,
  } as SessionData);

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkForDefault = <OptionsType extends Record<string, any>>(
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkForOverride = <OptionsType extends Record<string, any>>(
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
