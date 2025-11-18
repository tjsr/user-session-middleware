import { SessionDataTestContext, UserAppTestContext } from '../../../api/utils/testcontext.ts';
import { SessionTestContext, WithSessionTestContext } from './session.ts';

import { MockRequest } from 'vitest-mock-express/dist/src/request/index.js';
import { SystemHttpRequestType } from '../../../types/request.ts';
import { TestContext } from 'vitest';
import express from '../../../express/index.ts';
import getMockReq from 'vitest-mock-express/dist/src/request/request.js';

export type SessionEnabledRequestContext<
  Req extends express.Request = SystemHttpRequestType,
  SessionContext extends SessionTestContext = WithSessionTestContext,
> = SessionDataTestContext &
  SessionContext &
  UserAppTestContext &
  TestContext & {
    request: Req;
  };

export const setupRequestContext = <RequestType extends express.Request>(
  context: UserAppTestContext,
  requestData?: MockRequest | undefined
): SessionEnabledRequestContext<RequestType> => {
  assert(context.app !== undefined, 'context.app not defined - have you called setupAppContext()?');
  const outputContext = context as SessionEnabledRequestContext<RequestType>;

  const sessionOptions = context.app.locals['sessionOptions'];
  outputContext.request = getMockReq<RequestType>({
    app: context.app,
    sessionStore: sessionOptions.store,
    ...requestData,
  });

  return outputContext;
};
