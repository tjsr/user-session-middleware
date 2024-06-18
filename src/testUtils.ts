import { Cookie, MemoryStore, SessionData, Store } from './express-session/index.js';
import { ErrorRequestHandler, NextFunction, RequestHandler } from './express/index.js';
import { Mock, MockInstance, TaskContext, expect, vi } from "vitest";
import { getMockReq, getMockRes } from "vitest-mock-express";

import {
  HandlerName,
} from "./types.js";
import { MockRequest } from "vitest-mock-express/dist/src/request";
import { SystemHttpRequestType } from "./types/request.js";
import { SystemHttpResponseType } from "./types/response.js";
import { UserSessionData } from "./types/session.js";
import { markHandlersCalled } from "./utils/testing/markHandlers.js";

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

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

export interface SessionDataTestContext extends TaskContext {
  memoryStore?: Store;
  testRequestData: MockRequestWithSession;
  testSessionStoreData: UserSessionData;
}

declare module 'vitest' {
  export interface TestContext {
    memoryStore?: Store;
    testRequestData: MockRequestWithSession;
    testSessionStoreData: UserSessionData;
  }
};

// eslint-disable-next-line valid-jsdoc
/**
 * @deprecated This method should not be called directly. Use XYZ instead.
 */
export const getMockReqResp = <
RequestType extends SystemHttpRequestType = SystemHttpRequestType<UserSessionData>,
ResponseType extends SystemHttpResponseType = SystemHttpResponseType<UserSessionData>
>(requestProps?: MockRequest | undefined, mockResponseData?: Partial<ResponseType>): MockReqRespSet => {
  // @ts-expect-error TS6311
  const { clearMockRes, next, res: response, _mockClear } = getMockRes<ResponseType>(mockResponseData);
  const request: RequestType = getMockReq(requestProps);
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

/**
 * @deprecated This method should not be called directly. Use XYZ instead.
 */
export const getMockRequestResponse: <
ResponseType extends SystemHttpResponseType = SystemHttpResponseType<UserSessionData>
// eslint-disable-next-line no-unused-vars
>(values?: MockRequest | undefined, mockResponseData?: Partial<ResponseType>) => MockReqRespSet = getMockReqResp;
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

export type MiddlewareTypes = (RequestHandler | ErrorRequestHandler)[];

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
  requestDataOverrides: MockRequestWithSession = {},
  testRunOptions: SessionTestRunOptions = {
    silentCallHandlers: true,
  }
): {  } & MockReqRespSet => {
  if (context.testRequestData === undefined) {
    createContextForSessionTest(context);
  }
  const mockRequestData: MockRequestWithSession = {
    ...context.testRequestData,
    ...requestDataOverrides,
  };
  const mocks: MockReqRespSet = getMockReqResp<SystemHttpRequestType<UserSessionData>>(mockRequestData);
  const { request, response } = mocks;
  context.testRequestData['newSessionIdGenerated'] = true;
  if (mockRequestData.sessionID && !testRunOptions.skipAddToStore) {
    context.memoryStore?.get(mockRequestData.sessionID, (err, data) => {
      if (err) {
        console.error(err);
      }
      if (data) {
        console.warn(createTestRequestSessionData,
          'createTestRequestSessionData overwrote existing sessionID data in memory store.',
          mockRequestData.sessionID);
      }
    });
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

export interface MockRequestWithSession extends MockRequest {
  sessionID?: string | undefined;
  newSessionIdGenerated?: boolean | undefined;
  sessionStore?: Store | undefined;
}

export const createContextForSessionTest = (
  context: SessionDataTestContext,
  requestDataDefaults: MockRequestWithSession = {},
  sessionStoreDefaults: Partial<UserSessionData> = {}
): void => {
  const cookie = new Cookie();
  if (!context.memoryStore) {
    context.memoryStore = new MemoryStore();
  }
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
    email: sessionStoreDefaults.email ?? "test-email",
    hasLoggedOut: sessionStoreDefaults.hasLoggedOut ?? false,
    newId: undefined,
    userId: sessionStoreDefaults.userId ?? 'test-user-id',
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
