import { Cookie, Session } from '../express-session/index.js';
import { EmailAddress, UserId } from '../types.js';
import {
  NIL_UUID,
  SessionDataTestContext,
  createContextForSessionTest,
  createTestRequestSessionData,
} from '../testUtils.js';
import { SessionNotGeneratedError, SessionUserInfoError } from '../errors/errorClasses.js';
import { createRandomIdAndSave, createUserIdFromEmail, getUserIdFromSession } from './user.js';
import { createTestSessionId, generateUserIdForTest } from '../utils/testIdUtils.js';
import { v5, validate as validateUuid } from 'uuid';

import { UserIdTaskContext } from '../utils/testing/types.js';
import { UserSessionData } from '../types/session.js';
import { setUserIdNamespace } from './userNamespace.js';

describe('createUserIdFromEmail', () => {
  const initialEnvNamespace = v5('createUserIdFromEmail.env', NIL_UUID);

  test('Should create a uuid5 applicable to namespace for an email address.', () => {
    const testValues = {
      'alternate@example.com': '92b8d605-3168-52fc-9da2-b8974b64de2d',
      'test@example.com': 'be45fac6-b38b-595b-b04f-68ff68bae447',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    Object.keys(testValues).forEach((email) => {
      const testUserId = createUserIdFromEmail(initialEnvNamespace, email as EmailAddress);
      expect(testUserId, `Failed matching ${email}`).toEqual(testValues[email]);
    });
  });

  test('Should reject creating an id from an email address if the namespace is not a valid UUID.', () => {
    expect(() => createUserIdFromEmail('not-a-valid-uuid', 'email@example.com')).toThrowError(expect.any(TypeError));
  });

  test('Should reject creating an id from an undefined email address.', () => {
    expect(() => createUserIdFromEmail(initialEnvNamespace, undefined!)).toThrowError(expect.any(Error));
  });
});

describe('getUserIdFromSession', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test<UserIdTaskContext>('Should reject with an error if no session is defined', async ({ userIdNamespace }) => {
    expect(() => getUserIdFromSession(userIdNamespace, undefined!, true)).rejects.toThrowError(
      expect.any(SessionNotGeneratedError)
    );
  });

  test<UserIdTaskContext>('Should reject with an error if has session is but has no user', async ({
    task,
    userIdNamespace,
  }) => {
    const testSessionId = createTestSessionId(task.name);
    const testSessionData: Partial<Session & UserSessionData> = {
      cookie: new Cookie(),
      email: undefined!,
      id: testSessionId,
      userId: undefined,
    };

    expect(
      async () => await getUserIdFromSession(userIdNamespace, testSessionData as Session & UserSessionData, true)
    ).rejects.toThrowError(expect.any(SessionUserInfoError));
  });

  test<SessionDataTestContext>('Should not throw an error for an anonymous user with no email', async (context) => {
    const testSessionId = createTestSessionId(context.task.name);
    const testUserId: UserId = generateUserIdForTest(context);
    const testSessionData: Partial<Session & UserSessionData> = {
      cookie: new Cookie(),
      email: undefined!,
      id: testSessionId,
      userId: testUserId,
    };
    const idPromise: UserId = await getUserIdFromSession(
      context.userIdNamespace,
      testSessionData as Session & UserSessionData,
      true
    );
    expect(idPromise).toEqual('0bdf936c-1af1-572c-817a-539b8727d2d6');
  });

  test<SessionDataTestContext>('Should create a new userId from the email and save if session exists with no userId', async (context) => {
    const userIdNamespace = v5(context.task.name, NIL_UUID);
    setUserIdNamespace(userIdNamespace);
    const testSessionId = createTestSessionId(context.task.name);

    const { request, spies } = createTestRequestSessionData(
      context,
      {
        sessionID: testSessionId,
      },
      {
        spyOnSave: true,
      }
    );
    request.session.email = 'test-email@example.com';
    request.session.userId = undefined!;

    const idPromise: UserId = await getUserIdFromSession(userIdNamespace, request.session, false);
    expect(spies?.get(request.session.save)).toHaveBeenCalled();
    expect(validateUuid(idPromise)).toEqual(true);
  });
});

describe('createRandomIdAndSave', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test<SessionDataTestContext>('Should generate an id and then call save on the promise', async (context) => {
    const userIdNamespace = v5(context.task.name, NIL_UUID);
    setUserIdNamespace(userIdNamespace);

    const { request, spies } = createTestRequestSessionData(
      context,
      {},
      {
        spyOnSave: true,
      }
    );

    const session = request.session;
    session.userId = undefined!;
    const newId: UserId = await createRandomIdAndSave(userIdNamespace, session);
    expect(spies?.get(session.save)).toHaveBeenCalled();
    expect(newId).not.toBeUndefined();
    expect(validateUuid(newId)).toEqual(true);

    await expect(createRandomIdAndSave(userIdNamespace, session)).resolves.not.toBeUndefined();
  });

  test<SessionDataTestContext>('Should throw an error occuring while saving a session with new id', async (context) => {
    const userIdNamespace = v5(context.task.name, NIL_UUID);
    setUserIdNamespace(userIdNamespace);

    const { request } = createTestRequestSessionData(context);

    const session = request.session;
    session.save = vi.fn((cb) => {
      const err = new Error('Test Error');
      cb!(err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
    session.userId = undefined!;

    await expect(createRandomIdAndSave(userIdNamespace, session)).rejects.toThrow(expect.any(Error));
  });
});
