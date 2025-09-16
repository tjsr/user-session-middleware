import { Cookie, Store } from './express-session/index.ts';
import { Mock, MockInstance, TaskContext } from 'vitest';
import { SessionTestContext, WithSessionTestContext } from './utils/testing/context/session.ts';
import express, { ErrorRequestHandler, Handler, NextFunction, RequestHandler } from './express/index.ts';
import { getMockReq, getMockRes } from 'vitest-mock-express';
import { mockExpress, mockSession } from './utils/testing/mocks.ts';

import { MockRequest } from 'vitest-mock-express/dist/src/request/index.js';
import { SessionDataTestContext } from './api/utils/testcontext.ts';
import { SessionEnabledRequestContext } from './utils/testing/context/request.ts';
import { SystemHttpRequestType } from './types/request.ts';
import { SystemHttpResponseType } from './types/response.ts';
import { UserSessionData } from './types/session.ts';
import { createResponseLocals } from './middleware/handlers/handleLocalsCreation.ts';
import { markHandlersCalled } from './utils/testing/markHandlers.ts';
import { storeSetAsPromise } from './utils/sessionSetPromise.ts';

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export interface MockReqRespSet<
  RequestType extends SystemHttpRequestType = SystemHttpRequestType<UserSessionData>,
  ResponseType extends SystemHttpResponseType = SystemHttpResponseType<UserSessionData>,
> {
  clearMockReq: () => void;
  clearMockRes: () => void;
  mockClear: () => void;
  next: NextFunction;
  request: RequestType;
  response: ResponseType;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  spies?: Map<Function, MockInstance>;
}

/* eslint-disable indent */
/**
 * @param {MockRequest | undefined} requestProps Values that should be provided as defaults or
 * overrides on the request.
 * @param {Partial<ResponseType>} mockResponseData Values that should be provided as defaults or
 * overrides on the response.
 * @deprecated Use setupRequestContext(AppContext, reqData) instead.
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

type UserHttpResp = SystemHttpResponseType<UserSessionData>;
/**
 * @deprecated This method should not be called directly. Use XYZ instead.
 */
export const getMockRequestResponse: <ResponseType extends SystemHttpResponseType = UserHttpResp>(
  _values?: MockRequest | undefined,
  _mockResponseData?: Partial<ResponseType>
) => MockReqRespSet = getMockReqResp;

/**
 * @deprecated This method should not be called directly. User setupRequestContext(AppContext, reqData).
 */
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
  context: SessionEnabledRequestContext,
  requestDataOverrides: MockRequestWithSession = {},
  testRunOptions: SessionTestRunOptions = {
    silentCallHandlers: true,
  }
): {} & MockReqRespSet => {
  assert(context.sessionOptions !== undefined);
  assert(context.sessionOptions.userIdNamespace !== undefined, 'SessionOptions must have userIdNamespace');
  assert(context.sessionOptions.store !== undefined, 'SessionOptions must have store');
  if (context.testRequestData === undefined) {
    createContextForSessionTest(context);
  }
  const mockRequestData: MockRequestWithSession = {
    ...context.testRequestData,
    app: context.app || mockExpress(context.sessionOptions),
    ...requestDataOverrides,
  };
  const mocks: MockReqRespSet = getMockReqResp<SystemHttpRequestType<UserSessionData>>(mockRequestData);
  mocks.response.locals = createResponseLocals(mocks.request, context);

  const fullTest = `${context.task.suite ? context.task.suite?.name + '/' : ''}${context.task.name}`;
  console.warn(`created mock getMockReqResp using deprecated method in test ${fullTest}`);

  const { request, response } = mocks;
  context.testRequestData['newSessionIdGenerated'] = true;
  if (mockRequestData.sessionID && !testRunOptions.skipAddToStore) {
    context.sessionOptions.store?.get(mockRequestData.sessionID, (err, data) => {
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
    context.sessionOptions.store?.set(mockRequestData.sessionID, context.testSessionStoreData);
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
  regenerateSessionId?: boolean | undefined;
  sessionID?: string | undefined;
  sessionStore?: Store | undefined;
}

export const createContextForSessionTest = (
  context: SessionDataTestContext & SessionTestContext & TaskContext,
  requestDataDefaults: MockRequestWithSession = {},
  sessionStoreDefaults: Partial<UserSessionData> = {}
): void => {
  assert(context.sessionOptions !== undefined);
  assert(context.sessionOptions.store !== undefined, 'SessionOptions must have store');
  context.testRequestData = {
    newSessionIdGenerated:
      requestDataDefaults.newSessionIdGenerated !== undefined ? requestDataDefaults.newSessionIdGenerated : false,
    sessionID: requestDataDefaults.sessionID !== undefined ? requestDataDefaults.sessionID : undefined,
    sessionStore: context.sessionOptions.store,
  };

  context.testSessionStoreData = {
    cookie: new Cookie(),
    email: sessionStoreDefaults.email ?? 'test-email',
    hasLoggedOut: sessionStoreDefaults.hasLoggedOut ?? false,
    newId: undefined,
    userId: sessionStoreDefaults.userId ?? 'test-user-id',
  };
};

const addSessionToStore = async (context: WithSessionTestContext, sessionData: UserSessionData): Promise<void> => {
  return storeSetAsPromise(context.sessionOptions.store!, context.currentSessionId, sessionData);
};

export const addDataToSessionStore = async (
  context: WithSessionTestContext,
  sessionData: Partial<UserSessionData>
): Promise<UserSessionData> => {
  const fullSession = mockSession(context.sessionOptions.userIdNamespace, sessionData);
  return addSessionToStore(context, fullSession).then(() => fullSession);
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
