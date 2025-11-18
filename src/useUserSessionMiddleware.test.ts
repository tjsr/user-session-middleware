import express, { Express } from './express/index.ts';

import { ApiTestContext } from './api/utils/testcontext.ts';
import { TestContext } from 'vitest';
import { UserSessionOptions } from './types/sessionOptions.ts';
import { setupExpressContext } from './utils/testing/context/appLocals.ts';
import { setupSessionContext } from './utils/testing/context/session.ts';
import { setupUserIdContext } from './utils/testing/context/idNamespace.ts';
import { useUserSessionMiddleware } from './useUserSessionMiddleware.ts';

describe<ApiTestContext>('useUserSessionMiddleware', () => {
  beforeEach((context: ApiTestContext & TestContext) => {
    setupUserIdContext(context);
  });

  it('Should be able to configure the app when the userIdNamespace is provided.', (context: ApiTestContext &
    TestContext) => {
    setupSessionContext(context);

    setupExpressContext(context);
    useUserSessionMiddleware(context.app, context.sessionOptions);
  });

  it('Should fail if no userIdNamespace is provided.', () => {
    const app: Express = express();
    expect(() => {
      useUserSessionMiddleware(app, { secret: 'test-secret' } as UserSessionOptions);
    }).toThrowError('USM option name is required');
  });
});
