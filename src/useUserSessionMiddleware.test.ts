import express, { Express } from './express/index.js';

import { ApiTestContext } from './api/utils/testcontext.js';
import { addUserIdNamespaceToContext } from './utils/testing/testNamespaceUtils.js';
import supertest from 'supertest';
import { testableApp } from './utils/testing/middlewareTestUtils.js';
import { useUserSessionMiddleware } from './useUserSessionMiddleware.js';

describe<ApiTestContext>('useUserSessionMiddleware', () => {
  // beforeEach((context: UserIdTaskContext & UserAppTaskContext) => {
  //   setUserIdNamespaceForTest(context);
  // });
  beforeEach((context: ApiTestContext) => {
    // context.sessionOptions = {
    //   getTaskContextUserIdNamespace(context);
    // }
    context.app = testableApp(context.sessionOptions);
  });

  it('Should be able to configure the app when the userIdNamespace is provided.', (context: ApiTestContext) => {
    context.sessionOptions = {
      userIdNamespace: context.userIdNamespace,
    };
    context.app = testableApp(context.sessionOptions);
    addUserIdNamespaceToContext(context);
    useUserSessionMiddleware(context.app, { userIdNamespace: context.userIdNamespace });
  });

  it.todo('Should be able to configure the app when no userIdNamespace is provided.', () => {
    const app: Express = express();
    useUserSessionMiddleware(app, {});
  });
});

describe('useUserSessionMiddleware alternate SID', () => {
  test('Response should have a session Id assigned by builtin express session middleware.', async () => {
    const sessionOptions = {
      name: 'test.sid',
    };
    const app = testableApp(sessionOptions);
    const agent = await supertest(app)
      .get('/')
      .expect('set-cookie', /test.sid/);
    const cookieHeaders = agent?.headers['set-cookie'];
    expect(cookieHeaders).toHaveLength(1);
    expect(agent?.headers['sessionId']).toBeUndefined();
  });

  test('Response should return same sessionId previously provided when passed back.', async () => {
    const sessionOptions = {
      name: 'test.sid',
    };
    const app = testableApp(sessionOptions);
    const agent = await supertest(app)
      .get('/')
      .expect('set-cookie', /test.sid/);
    const cookieHeaders = agent?.headers['set-cookie'];
    expect(cookieHeaders).toHaveLength(1);
    console.log(cookieHeaders![0]!);
    const sidMatches = cookieHeaders![0]?.match(/test.sid=s%3A([a-f0-9\\-]+)\..*;/);
    const sidValue = sidMatches![1];

    await supertest(app)
      .get('/')
      .set('Set-Cookie', cookieHeaders![0]!)
      .expect('set-cookie', /test.sid/)
      .expect('set-cookie', new RegExp(`/${sidValue}/`));
    expect(agent?.headers['sessionId']).toBeUndefined();
  });

  test('Response should have a session Id using default sid name.', async () => {
    const sessionOptions = {};
    const app = testableApp(sessionOptions);
    const agent = await supertest(app)
      .get('/')
      .expect('set-cookie', /connect.sid/);
    const cookieHeaders = agent?.headers['set-cookie'];
    expect(cookieHeaders).toHaveLength(1);
    expect(agent?.headers['sessionId']).toBeUndefined();
  });
});
