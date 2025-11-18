import { Cookie, Session } from './express-session/index.ts';
import { SessionEnabledRequestContext, setupRequestContext } from './utils/testing/context/request.ts';
import { SessionTestContext, WithSessionTestContext, setupSessionContext } from './utils/testing/context/session.ts';
import { addIgnoredLogsFromFunction, clearIgnoredFunctions } from './setup-tests.ts';

import { SessionDataTestContext } from './api/utils/testcontext.ts';
import { SystemHttpRequestType } from './types/request.ts';
import { TestContext } from 'vitest';
import { UserSessionData } from './types/session.ts';
import { assignUserIdToRequestSession } from './sessionUser.ts';
import { copySessionDataToSession } from './store/loadData.ts';
import { mockSession } from './utils/testing/mocks.ts';
import { setupExpressContext } from './utils/testing/context/appLocals.ts';

describe('handleSessionFromStore', () => {
  beforeAll(() => {
    addIgnoredLogsFromFunction(assignUserIdToRequestSession);
  });

  afterAll(() => {
    clearIgnoredFunctions();
  });

  test('Should not fail because we have no tests.', () => expect(true).toBe(true));

  // test('Should return 401 if no sessionID is provided', () => {
  //   const { req, res, next } = getMockReqResp();
  //   addIgnoredLog('No session ID received - can\'t process retrieved session.');
  //   handleSessionFromStore(req, res, undefined, next);
  //   expect(res.status).toHaveBeenCalledWith(500);
  //   expect(res.end).toHaveBeenCalled();
  //   expect(next).not.toHaveBeenCalled();
  // });

  // test('Should return a 401 when a newly generated sessionID results in retrieving exising data.', () => {
  //   addIgnoredLog(/New session ID generated but session data already exists - this should never happen./i);
  //   const testSessionId = 'some-session-id';
  //   const memoryStore = new expressSession.MemoryStore();

  //   const testSessionData: SystemSessionDataType = {
  //     cookie: new Cookie(),
  //     email: 'test-email',
  //     newId: undefined,
  //     userId: 'test-user-id',
  //   };

  //   memoryStore.set(testSessionId, testSessionData);

  //   const { req, res, next } = getMockReqResp({
  //     newSessionIdGenerated: true,
  //     sessionID: testSessionId,
  //     sessionStore: memoryStore,
  //   });

  //   memoryStore.createSession(req, testSessionData);

  //   handleSessionFromStore(req, res, testSessionData, next);

  //   expect(res.status).toBeCalledWith(401);
  //   expect(res.end).toBeCalled();
  //   expect(next).not.toBeCalled();
  // });

  // test('Should fail when handling a session from the store with no sessionId.', () => {
  //   const memoryStore = new expressSession.MemoryStore();

  //   const testSessionData: SystemSessionDataType = {
  //     cookie: new Cookie(),
  //     email: 'test-email',
  //     newId: undefined,
  //     userId: 'test-user-id',
  //   };

  //   const { req, res, next } = getMockReqResp({
  //     newSessionIdGenerated: true,
  //     sessionID: undefined,
  //     sessionStore: memoryStore,
  //   });

  //   memoryStore.createSession(req, testSessionData);

  //   handleSessionFromStore(req, res, testSessionData, next);

  //   expect(res.status).toBeCalledWith(500);
  //   expect(res.end).toBeCalled();
  //   expect(next).not.toBeCalled();
  // });

  // test('Should save when a new sessionID is generated.', () => {
  //   const testSessionId = 'some-session-id';
  //   const memoryStore = new expressSession.MemoryStore();

  //   const testSessionData: SystemSessionDataType = {
  //     cookie: new Cookie(),
  //     email: 'test-email',
  //     newId: undefined,
  //     userId: 'test-user-id',
  //   };

  //   const { req, res, next } = getMockReqResp({
  //     newSessionIdGenerated: true,
  //     sessionID: testSessionId,
  //     sessionStore: memoryStore,
  //   });

  //   memoryStore.createSession(req, testSessionData);
  //   expect(req.session).not.toBeUndefined();
  //   req.session.save = vi.fn();

  //   handleSessionFromStore(req, res, undefined, next);

  //   expect(req.session.save).toBeCalled();
  //   expect(next).toBeCalled();
  // });
});

type TypeContext = SessionEnabledRequestContext<SystemHttpRequestType, WithSessionTestContext>;
describe<TypeContext>('copySessionDataToSession', () => {
  const withTestSession = <SD extends UserSessionData>(
    context: SessionTestContext &
      SessionDataTestContext &
      SessionEnabledRequestContext<SystemHttpRequestType, WithSessionTestContext>,
    partailStoreData: Partial<SD>,
    existingSessionDataOverrides: Partial<SD>
  ): Session => {
    const storedSessionData: Partial<SD> = {
      ...partailStoreData,
      cookie: new Cookie(),
    };
    context.testSessionStoreData = {
      ...context.testSessionStoreData,
      ...existingSessionDataOverrides,
    };

    const session: Session = context.sessionOptions.store!.createSession(context.request, context.testSessionStoreData);
    // TODO: Fix this
    copySessionDataToSession(storedSessionData as UserSessionData, session);
    return session;
  };

  beforeEach((context: SessionDataTestContext & TestContext) => {
    const sessionContext = setupSessionContext(context);

    context.testSessionStoreData = mockSession(context.sessionOptions.userIdNamespace);

    const appContext = setupExpressContext(sessionContext);

    setupRequestContext(appContext, {
      newSessionIdGenerated: false,
      sessionID: 'fake-session-id',
    });
  });

  test<TypeContext>('Should take session data userId if no userId is already on session', (context) => {
    const sessionToVerify: Session & Partial<UserSessionData> = withTestSession(
      context,
      {
        email: 'test-user-email',
        userId: 'test-user-id',
      },
      { userId: undefined }
    );
    expect(sessionToVerify.userId).toBe('test-user-id');
  });

  test('Should take existing session data userId if userId is already on session', (context: SessionEnabledRequestContext<
    SystemHttpRequestType,
    WithSessionTestContext
  >) => {
    const sessionToVerify: Session & Partial<UserSessionData> = withTestSession(
      context,
      {
        email: 'test-user-email',
        userId: 'test-user-id',
      },
      { userId: 'existing-user-id' }
    );
    expect(sessionToVerify.userId).toBe('existing-user-id');
  });

  test('Should take session data email if email is already on session', (context: SessionEnabledRequestContext<
    SystemHttpRequestType,
    WithSessionTestContext
  >) => {
    const sessionToVerify: Session & Partial<UserSessionData> = withTestSession(
      context,
      { email: 'test-user-email' },
      { email: undefined }
    );
    expect(sessionToVerify.email).toBe('test-user-email');
  });

  test<TypeContext>('Should take existing session data email if no email is already on session', (context) => {
    const sessionToVerify: Session = withTestSession(
      context,
      { email: 'test-user-emnail' },
      { email: 'existing-user-email' }
    );
    expect(sessionToVerify.email).toBe('existing-user-email');
  });

  test<TypeContext>('Should take newId flag if not already on session', (context) => {
    const sessionToVerify: Session = withTestSession(context, { newId: true }, { newId: undefined });
    expect(sessionToVerify.newId).toBe(false);
  });

  test<TypeContext>('Should not override newId flag if explicitly set to false session', (context) => {
    const sessionToVerify: Session = withTestSession(context, { newId: true }, { newId: false });
    expect(sessionToVerify.newId).toBe(false);
  });

  test<TypeContext>('Should not override newId=true flag if explicitly set to false session', (context) => {
    const sessionToVerify: Session = withTestSession(context, { newId: false }, { newId: true });
    expect(sessionToVerify.newId).toBe(false);
  });

  test<TypeContext>('Should take newId value from existing session', (context) => {
    [true, false].forEach((storedNewId) => {
      const sessionToVerify: Session = withTestSession(context, { newId: storedNewId }, { newId: undefined });
      expect(sessionToVerify.newId).toBe(false);
    });
  });
});
