import express, { Express } from './express/index.js';

import { ApiTestContext } from './api/utils/testcontext.js';
import { TaskContext } from 'vitest';
import { UserSessionOptions } from './types/sessionOptions.js';
import { setupExpressContext } from './utils/testing/context/appLocals.js';
import { setupSessionContext } from './utils/testing/context/session.js';
import { setupUserIdContext } from './utils/testing/context/idNamespace.js';
import { useUserSessionMiddleware } from './useUserSessionMiddleware.js';

describe<ApiTestContext>('useUserSessionMiddleware', () => {
  beforeEach((context: ApiTestContext & TaskContext) => {
    setupUserIdContext(context);
  });

  it('Should be able to configure the app when the userIdNamespace is provided.', (context: ApiTestContext &
    TaskContext) => {
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
