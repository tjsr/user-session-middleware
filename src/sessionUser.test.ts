import {
  RequestSessionIdRequiredError,
  SessionDataNotFoundError,
  SessionIdRequiredError,
  SessionIdTypeError
} from "./errors/errorClasses.js";
import {
  SessionDataTestContext,
  createContextForSessionTest,
  createTestRequestSessionData,
} from "./testUtils.js";
import { addIgnoredLog, clearIgnoredFunctions } from "./setup-tests.js";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { assignUserIdToRequestSession, assignUserIdToSession, saveSessionPromise } from "./sessionUser.js";

describe('assignUserIdToSession', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test('Should assign a new userId to the session if there is not already one set.',
    async (context: SessionDataTestContext) => {
      // eslint-disable-next-line
      addIgnoredLog(/Assigned a new userId ([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}) to session test-session-id/i);
      const { request, spies } = createTestRequestSessionData(context, {
        sessionID: 'test-session-id',
      }, {
        overrideSessionData: {
          userId: undefined,
        },
        spyOnSave: true,
      });

      expect(request.session).toBeDefined();
      const saveMock = spies?.get(request.session.save);

      await expect((async () =>
        await assignUserIdToSession(request.session))
      ()).
        resolves.
        not.
        toThrowError();

      expect(request.session.userId).not.toBe(undefined);
      expect(saveMock).toHaveBeenCalled();
    });

  test('Should throw an error if the session is not defined on request.', async (context) => {
    const { request } = createTestRequestSessionData(context, {}, {
      skipCreateSession: true,
    });

    expect(request.session).toBeUndefined();

    await expect((async () =>
      await assignUserIdToSession(request.session))()).rejects.toThrowError(expect.any(SessionDataNotFoundError));
  });

  test('Should throw an error if the session has no id.', async (context) => {
    const { request } = createTestRequestSessionData(context, {
      sessionID: undefined,
    }, {
      skipCreateSession: false,
    });

    expect(request.session).toBeDefined();

    await expect((async() =>
      await assignUserIdToSession(request.session))()).rejects.toThrowError(expect.any(SessionIdRequiredError));
  });

  test('Should reject if the session id is not defined on request.', async (context) => {
    expect(context.testRequestData.sessionID).toBe(undefined);
    const { request } = createTestRequestSessionData(context, {}, {
      skipCreateSession: false,
    });
    expect(request.sessionID).toBe(undefined);

    context.memoryStore?.set('test-session-id', context.testSessionStoreData);

    expect(request.session).toBeDefined();

    await expect((async () =>
      await assignUserIdToSession(request.session))()).rejects.toThrowError(SessionIdRequiredError);
  });
});

describe('assignUserIdToRequestSession', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  afterEach(() => {
    clearIgnoredFunctions();
  });

  test('Should assign a new userId to the session if there is not already one set.', async (context) => {
    const sessionID = 'test-session-id';
    const { request, spies } = createTestRequestSessionData(context, {
      sessionID,
    }, {
      noMockSave: true,
      overrideSessionData: {
        userId: undefined,
      },
      spyOnSave: true,
    });

    const saveMock = spies?.get(request.session.save);

    await expect((async () => await assignUserIdToRequestSession(request))()).resolves.not.toThrowError();
    expect(request.session.userId).not.toBe(undefined);
    expect(saveMock).toHaveBeenCalled();
  });

  test('Should throw an error if the request sessionID is not defined on request.', async (context) => {
    const { request } = createTestRequestSessionData(context, {
      sessionID: undefined,
    }, {
      skipCreateSession: true,
    });

    await expect((async () =>
      await assignUserIdToRequestSession(request))
    ()).rejects.toThrowError(expect.any(RequestSessionIdRequiredError));
  });

  test('Should throw an error if the session is not defined on request.', async (context) => {
    const { request } = createTestRequestSessionData(context, {
      sessionID: 'test-session-id',
    }, {
      skipCreateSession: true,
    });

    return expect((async () =>
      await assignUserIdToRequestSession(request))
    ()).rejects.toThrowError(expect.any(SessionDataNotFoundError));
  });


  test('Should throw exception if the session is not defined on request.', async (context) => {
    const { request } = createTestRequestSessionData(context, {
      sessionID: 'test-session-id',
    }, {
      skipCreateSession: true,
    });

    await expect((async () =>
      await assignUserIdToRequestSession(request))
    ()).rejects.toThrowError(expect.any(SessionDataNotFoundError));
  });

  test('Should throw an exception if the session has no id.', async (context) => {
    const { request } = createTestRequestSessionData(context, {
      sessionID: undefined,
    }, {});

    expect(request.session).toBeDefined();
    expect(request.sessionID).toBeUndefined();
    expect(request.session.id).toBeUndefined();

    await expect((async () =>
      await assignUserIdToRequestSession(request))
    ()).rejects.toThrowError(expect.any(RequestSessionIdRequiredError));
  });

  test('Requires a session to be defined on the request.', async (context) => {
    const { request } = createTestRequestSessionData(context, {
      sessionID: 'test-session-id',
    }, {
      skipCreateSession: true,
    });

    expect(request.sessionID).toBeDefined();
    expect(request.session).toBeUndefined();

    await expect((async () =>
      await assignUserIdToRequestSession(request))
    ()).rejects.toThrowError(expect.any(SessionDataNotFoundError));
  });

  test('Requires a session id to be defined on the request.', async (context) => {
    const { request } = createTestRequestSessionData(context, { sessionID: undefined }, {});

    expect(request.session).toBeDefined();
    expect(request.sessionID).not.toBeDefined();
    expect(request.session.id).not.toBeDefined();

    await expect((async () =>
      await assignUserIdToRequestSession(request))
    ()).rejects.toThrowError(expect.any(RequestSessionIdRequiredError));
  });

  test('Requires a session id on the session to be a string.', async (context) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forcedNumericSessionID: string = 12345 as any as string;
    const { request } = createTestRequestSessionData(context, { sessionID: forcedNumericSessionID }, {});

    expect(request.session).toBeDefined();

    await expect((async () =>
      await assignUserIdToRequestSession(request))
    ()).rejects.toThrowError(expect.any(SessionIdTypeError));
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
