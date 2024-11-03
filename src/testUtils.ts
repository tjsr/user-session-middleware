import { Application, IRouterMatcher } from 'express';
import { Cookie, MemoryStore, SessionData, Store } from './express-session/index.js';
import { Mock, MockInstance } from 'vitest';
import express, { ErrorRequestHandler, Handler, NextFunction, RequestHandler } from './express/index.js';
import { getMockReq, getMockRes } from 'vitest-mock-express';

import { MockRequest } from 'vitest-mock-express/dist/src/request';
import { SessionDataTestContext } from './api/utils/testcontext.js';
import { SystemHttpRequestType } from './types/request.js';
import { SystemHttpResponseType } from './types/response.js';
import { UserSessionData } from './types/session.js';
import { markHandlersCalled } from './utils/testing/markHandlers.js';
import { setAppUserIdNamespace } from './auth/userNamespace.js';
import { setUserIdNamespaceForTest } from './utils/testing/testNamespaceUtils.js';

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export interface MockReqRespSet<
  RequestType extends SystemHttpRequestType = SystemHttpRequestType<UserSessionData>,
  ResponseType extends SystemHttpResponseType = SystemHttpResponseType<UserSessionData>,
> {
  appStorage: Record<string, unknown>;
  clearMockReq: () => void;
  clearMockRes: () => void;
  mockClear: () => void;
  next: NextFunction;
  request: RequestType;
  response: ResponseType;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  spies?: Map<Function, MockInstance>;
}

declare module 'vitest' {
  export interface TestContext {
    memoryStore?: Store;
    testRequestData: MockRequestWithSession;
    testSessionStoreData: UserSessionData;
  }
}

/* eslint-disable indent */
/**
 * @param {MockRequest | undefined} requestProps Values that should be provided as defaults or
 * overrides on the request.
 * @param {Partial<ResponseType>} mockResponseData Values that should be provided as defaults or
 * overrides on the response.
 * @deprecated This method should not be called directly. Use XYZ instead.
 * @return {MockReqRespSet} A set of mocks for request and response objects.
*/
export const getMockReqResp = <
  RequestType extends SystemHttpRequestType = SystemHttpRequestType<UserSessionData>,
  ResponseType extends SystemHttpResponseType = SystemHttpResponseType<UserSessionData>,
>(
  requestProps?: MockRequest | undefined,
  mockResponseData?: Partial<ResponseType>
): MockReqRespSet => {
  /* eslint-enable indent */
  // @ts-expect-error TS6311
  const { clearMockRes, next, res: response, _mockClear } = getMockRes<ResponseType>(mockResponseData);
  const request: RequestType & { app: express.Application } = getMockReq(requestProps);
  // const appStorage: Map<string, unknown> = {};
  const appStorage: Record<string, unknown> = {};
  const mockApp: Partial<Application> | undefined = request.app;
  if (mockApp) {
    if (mockApp.get) {
      console.info('Mock app has get method.', mockApp.get);
    } else {
      mockApp.get = ((name: string) => appStorage[name]) as IRouterMatcher<Application>;
    }

    if (mockApp.set) {
      console.info('Mock app has set method.', mockApp.set);
    } else {
      mockApp.set = (name: string, val: unknown): Application => {
        appStorage[name] = val;
        return mockApp as Application;
      };
    }
  }

  const clearMockReq = () => {
    console.debug('TODO: Clearing request mock is not yet implemented.');
  };

  const clear = () => {
    clearMockReq();
    clearMockRes();
    // TODO: Clear response mocks
  };

  return { appStorage, clearMockReq, clearMockRes, mockClear: clear, next, request, response };
};

/**
 * @deprecated This method should not be called directly. Use XYZ instead.
 */
export const getMockRequestResponse: <
  ResponseType extends SystemHttpResponseType = SystemHttpResponseType<UserSessionData>,
>(
  _values?: MockRequest | undefined,
  _mockResponseData?: Partial<ResponseType>
) => MockReqRespSet = getMockReqResp;
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

  const mock: Mock = vi.fn((...args: Params): Return => {
    if (resolver) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver(args as any);
    }
    return template as unknown as Return;
  });
  return [promise, mock];
};

export type MiddlewareTypes = (RequestHandler | ErrorRequestHandler)[];

interface SessionTestRunOptions {
  markHandlersCalled?: (Handler | ErrorRequestHandler)[];
  noMockSave?: boolean;
  overrideSessionData?: Partial<UserSessionData>;
  silentCallHandlers?: boolean;
  skipAddToStore?: boolean;
  skipCreateSession?: boolean;
  spyOnSave?: boolean;
}

export const createTestRequestSessionData = (
  context: SessionDataTestContext,
  requestDataOverrides: MockRequestWithSession = {},
  testRunOptions: SessionTestRunOptions = {
    silentCallHandlers: true,
  }
): {} & MockReqRespSet => {
  if (context.testRequestData === undefined) {
    createContextForSessionTest(context);
  }
  const mockRequestData: MockRequestWithSession = {
    ...context.testRequestData,
    ...requestDataOverrides,
  };
  const mocks: MockReqRespSet = getMockReqResp<SystemHttpRequestType<UserSessionData>>(mockRequestData);
  setAppUserIdNamespace(mocks.request.app, context.userIdNamespace);
  console.warn('created mock getMockReqResp using deprecated method.');

  const { request, response } = mocks;
  context.testRequestData['newSessionIdGenerated'] = true;
  if (mockRequestData.sessionID && !testRunOptions.skipAddToStore) {
    context.memoryStore?.get(mockRequestData.sessionID, (err, data) => {
      if (err) {
        console.error(err);
      }
      if (data) {
        console.warn(
          createTestRequestSessionData,
          'createTestRequestSessionData overwrote existing sessionID data in memory store.',
          mockRequestData.sessionID
        );
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
  newSessionIdGenerated?: boolean | undefined;
  sessionID?: string | undefined;
  sessionStore?: Store | undefined;
}

export const createContextForSessionTest = (
  context: SessionDataTestContext,
  requestDataDefaults: MockRequestWithSession = {},
  sessionStoreDefaults: Partial<UserSessionData> = {}
): void => {
  setUserIdNamespaceForTest(context);

  const cookie = new Cookie();
  // context.userIdNamespace = createRandomIdNamespace(context.task.name);
  if (!context.memoryStore) {
    context.memoryStore = new MemoryStore();
  }
  context.memoryStore?.set('some-session-id', {
    cookie,
  } as SessionData);

  context.testRequestData = {
    newSessionIdGenerated:
      requestDataDefaults.newSessionIdGenerated !== undefined ? requestDataDefaults.newSessionIdGenerated : false,
    sessionID: requestDataDefaults.sessionID !== undefined ? requestDataDefaults.sessionID : undefined,
    sessionStore: context.memoryStore,
  };

  context.testSessionStoreData = {
    cookie,
    email: sessionStoreDefaults.email ?? 'test-email',
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
  defaultOptionsMethod: (_options: Partial<OptionsType>) => OptionsType
) => {
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
    expect(
      updatedOptions[key],
      `For ${key} updated value ${updatedOptions[key]} should not match default.`
    ).not.toEqual(defaultOptions[key]);
  }
  expect(updatedOptions[key], `For ${key} updated value ${updatedOptions[key]} should match context`).toEqual(
    contextOptions[key]
  );
};
