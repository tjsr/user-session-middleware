import {
  RequestSessionIdRequiredError,
  SessionDataNotFoundError,
  SessionIdRequiredError,
  SessionIdTypeError,
} from './errors/errorClasses.ts';
import { SessionTestContext, setupSessionContext } from './utils/testing/context/session.ts';
import { addIgnoredLog, clearIgnoredFunctions } from './setup-tests.ts';
import { assignUserIdToRequestSession, assignUserIdToSession, saveSessionPromise } from './sessionUser.ts';
import { createContextForSessionTest, createTestRequestSessionData } from './testUtils.ts';

import { SessionDataTestContext } from './api/utils/testcontext.ts';
import { SessionEnabledRequestContext } from './utils/testing/context/request.ts';
import { TaskContext } from 'vitest';
import { setupExpressContext } from './utils/testing/context/appLocals.ts';

describe<SessionDataTestContext>('assignUserIdToSession', () => {
  beforeEach((context: SessionDataTestContext & SessionTestContext) => {
    setupSessionContext(context);
    createContextForSessionTest(context);
  });

  test<SessionEnabledRequestContext>('Should assign a new userId to the session if there is not already one set.', async (context) => {
    addIgnoredLog(
      /Assigned a new userId ([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}) to session test-session-id/i
    );
    const { request, spies } = createTestRequestSessionData(
      context,
      {
        sessionID: 'test-session-id',
      },
      {
        overrideSessionData: {
          userId: undefined,
        },
        spyOnSave: true,
      }
    );

    expect(request.session).toBeDefined();
    const saveMock = spies?.get(request.session.save);

    await expect(
      (async () => await assignUserIdToSession(context.sessionOptions.userIdNamespace, request.session))()
    ).resolves.not.toThrowError();

    expect(request.session.userId).not.toBe(undefined);
    expect(saveMock).toHaveBeenCalled();
  });

  test<SessionEnabledRequestContext>('Should throw an error if the session is not defined on request.', async (context) => {
    const { request } = createTestRequestSessionData(
      context,
      {},
      {
        skipCreateSession: true,
      }
    );

    expect(request.session).toBeUndefined();

    await expect(
      (async () => await assignUserIdToSession(context.sessionOptions.userIdNamespace, request.session))()
    ).rejects.toThrowError(expect.any(SessionDataNotFoundError));
  });

  test<SessionEnabledRequestContext>('Should throw an error if the session has no id.', async (context) => {
    const { request } = createTestRequestSessionData(
      context,
      {
        sessionID: undefined,
      },
      {
        skipCreateSession: false,
      }
    );

    expect(request.session).toBeDefined();

    await expect(
      (async () => await assignUserIdToSession(context.sessionOptions.userIdNamespace, request.session))()
    ).rejects.toThrowError(expect.any(SessionIdRequiredError));
  });

  test<SessionEnabledRequestContext>('Should reject if the session id is not defined on request.', async (context) => {
    expect(context.testRequestData.sessionID).toBe(undefined);
    const { request } = createTestRequestSessionData(
      context,
      {},
      {
        skipCreateSession: false,
      }
    );
    expect(request.sessionID).toBe(undefined);

    context.sessionOptions.store?.set('test-session-id', context.testSessionStoreData);

    expect(request.session).toBeDefined();

    await expect(
      (async () => await assignUserIdToSession(context.sessionOptions.userIdNamespace, request.session))()
    ).rejects.toThrowError(SessionIdRequiredError);
  });
});

describe('assignUserIdToRequestSession', () => {
  beforeEach((context: SessionDataTestContext & SessionTestContext & TaskContext) => {
    setupSessionContext(context);
    createContextForSessionTest(context);
    setupExpressContext(context);
  });

  afterEach(() => {
    clearIgnoredFunctions();
  });

  test<SessionEnabledRequestContext>('Should assign a new userId to the session if there is not already one set.', async (context) => {
    const sessionID = 'test-session-id';
    const { request, spies } = createTestRequestSessionData(
      context,
      {
        sessionID,
      },
      {
        noMockSave: true,
        overrideSessionData: {
          userId: undefined,
        },
        spyOnSave: true,
      }
    );

    const saveMock = spies?.get(request.session.save);

    await expect((async () => await assignUserIdToRequestSession(request))()).resolves.not.toThrowError();
    expect(request.session.userId).not.toBe(undefined);
    expect(saveMock).toHaveBeenCalled();
  });

  test<SessionEnabledRequestContext>('Should throw an error if the request sessionID is not defined on request.', async (context) => {
    const { request } = createTestRequestSessionData(
      context,
      {
        sessionID: undefined,
      },
      {
        skipCreateSession: true,
      }
    );

    await expect((async () => await assignUserIdToRequestSession(request))()).rejects.toThrowError(
      expect.any(RequestSessionIdRequiredError)
    );
  });

  test<SessionEnabledRequestContext>('Should throw an error if the session is not defined on request.', async (context) => {
    const { request } = createTestRequestSessionData(
      context,
      {
        sessionID: 'test-session-id',
      },
      {
        skipCreateSession: true,
      }
    );

    return expect((async () => await assignUserIdToRequestSession(request))()).rejects.toThrowError(
      expect.any(SessionDataNotFoundError)
    );
  });

  test<SessionEnabledRequestContext>('Should throw exception if the session is not defined on request.', async (context) => {
    const { request } = createTestRequestSessionData(
      context,
      {
        sessionID: 'test-session-id',
      },
      {
        skipCreateSession: true,
      }
    );

    await expect((async () => await assignUserIdToRequestSession(request))()).rejects.toThrowError(
      expect.any(SessionDataNotFoundError)
    );
  });

  test<SessionEnabledRequestContext>('Should throw an exception if the session has no id.', async (context) => {
    const { request } = createTestRequestSessionData(
      context,
      {
        sessionID: undefined,
      },
      {}
    );

    expect(request.session).toBeDefined();
    expect(request.sessionID).toBeUndefined();
    expect(request.session.id).toBeUndefined();

    await expect((async () => await assignUserIdToRequestSession(request))()).rejects.toThrowError(
      expect.any(RequestSessionIdRequiredError)
    );
  });

  test<SessionEnabledRequestContext>('Requires a session to be defined on the request.', async (context) => {
    const { request } = createTestRequestSessionData(
      context,
      {
        sessionID: 'test-session-id',
      },
      {
        skipCreateSession: true,
      }
    );

    expect(request.sessionID).toBeDefined();
    expect(request.session).toBeUndefined();

    await expect((async () => await assignUserIdToRequestSession(request))()).rejects.toThrowError(
      expect.any(SessionDataNotFoundError)
    );
  });

  test<SessionEnabledRequestContext>('Requires a session id to be defined on the request.', async (context) => {
    const { request } = createTestRequestSessionData(context, { sessionID: undefined }, {});

    expect(request.session).toBeDefined();
    expect(request.sessionID).not.toBeDefined();
    expect(request.session.id).not.toBeDefined();

    await expect((async () => await assignUserIdToRequestSession(request))()).rejects.toThrowError(
      expect.any(RequestSessionIdRequiredError)
    );
  });

  test<SessionEnabledRequestContext>('Requires a session id on the session to be a string.', async (context) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forcedNumericSessionID: string = 12345 as any as string;
    const { request } = createTestRequestSessionData(context, { sessionID: forcedNumericSessionID }, {});

    expect(request.session).toBeDefined();

    await expect((async () => await assignUserIdToRequestSession(request))()).rejects.toThrowError(
      expect.any(SessionIdTypeError)
    );
  });
});

describe('saveSessionPromise', () => {
  test('Should give a rejected promise if an error is returned in the save callback', async () => {
    const session = {
      save: (callback: (_err: unknown) => void) => {
        callback(new Error('Test error'));
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect((async () => await saveSessionPromise(session as any))()).rejects.toThrowError('Test error');
  });

  test('Should give a resolved promise if no error is returned in the save callback', async () => {
    const session = {
      save: (callback: (_err: unknown) => void) => {
        callback(null);
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect((async () => await saveSessionPromise(session as any))()).resolves.not.toThrowError();
  });
});
