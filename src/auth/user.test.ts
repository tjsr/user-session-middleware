import { Cookie, Session } from '../express-session/index.js';
import { EmailAddress, UserId } from '../types.js';
import {
  SessionDataTestContext,
  createContextForSessionTest,
  createTestRequestSessionData,
} from '../testUtils.js';
import { SessionNotGeneratedError, SessionUserInfoError } from '../errors/errorClasses.js';
import { createRandomIdAndSave, createUserIdFromEmail, getUserIdFromSession } from './user.js';
import { createTestSessionId, generateUserIdForTest } from '../utils/testIdUtils.js';
import { v5, validate as validateUuid } from 'uuid';

import { UserSessionData } from '../types/session.js';
import { setUserIdNamespace } from './userNamespace.js';
import { setUserIdNamespaceForTest } from '../utils/testNamespaceUtils.js';

const nilUuid = '00000000-0000-0000-0000-000000000000';

describe('createUserIdFromEmail', () => {
  const initialEnvNamespace = v5('createUserIdFromEmail.env', nilUuid);
  beforeEach(() => {
    process.env['USERID_UUID_NAMESPACE'] = initialEnvNamespace;
    setUserIdNamespace(undefined!);
  });

  test('Should create a uuid5 applicable to the env namespace for an email address.', () => {
    const testValues = {
      'alternate@example.com': '92b8d605-3168-52fc-9da2-b8974b64de2d',
      'test@example.com': 'be45fac6-b38b-595b-b04f-68ff68bae447',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    Object.keys(testValues).forEach((email) => {
      const testUserId = createUserIdFromEmail(email as EmailAddress);
      expect(testUserId, `Failed matching ${email}`).toEqual(testValues[email]);
    });
  });

  test('Should create a uuid5 applicable to the provided namespace for an email address.', () => {
    const changedNamespace = v5('createUserIdFromEmail.alternate', nilUuid);
    setUserIdNamespace(changedNamespace);
    const testValues = {
      'alternate@example.com': '87f01eb8-ee54-55c3-8763-a589ab82e5d0',
      'test@example.com': '4c63c2e9-1aab-5c03-9027-5af3405dc410',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    Object.keys(testValues).forEach((email) => {
      const testUserId = createUserIdFromEmail(email as EmailAddress);
      expect(testUserId, `Failed matching ${email}`).toEqual(testValues[email]);
    });
  });
});

describe('getUserIdFromSession', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test('Should reject with an error if no session is defined', async() => {
    expect(() => getUserIdFromSession(undefined!, true)).rejects.toThrowError(expect.any(SessionNotGeneratedError));
  });

  test('Should reject with an error if has session is but has no user', async({ task }) => {
    const testSessionId = createTestSessionId(task.name);
    const testSessionData: Partial<Session & UserSessionData> = {
      cookie: new Cookie(),
      email: undefined!,
      id: testSessionId,
      userId: undefined,
    };

    expect(async () => await getUserIdFromSession(testSessionData as Session & UserSessionData,
      true)).rejects.toThrowError(expect.any(SessionUserInfoError));
  });

  test<SessionDataTestContext>('Should not throw an error for an anonymous user with no email', async(context) => {
    setUserIdNamespaceForTest(context);
    const testSessionId = createTestSessionId(context.task.name);
    const testUserId: UserId = generateUserIdForTest(context);
    const testSessionData: Partial<Session & UserSessionData> = {
      cookie: new Cookie(),
      email: undefined!,
      id: testSessionId,
      userId: testUserId,
    };
    const idPromise: UserId = await getUserIdFromSession(testSessionData as Session & UserSessionData, true);
    expect(idPromise).toEqual('0bdf936c-1af1-572c-817a-539b8727d2d6');
  });

  test<SessionDataTestContext>('Should create a new userId from the email and save if session exists with no userId',
    async(context) => {
      const userIdNamespace = v5(context.task.name, nilUuid);
      setUserIdNamespace(userIdNamespace);
      const testSessionId = createTestSessionId(context.task.name);

      const { request, spies } = createTestRequestSessionData(context, {
        sessionID: testSessionId,
      }, {
        spyOnSave: true,
      });
      request.session.email = 'test-email@example.com';
      request.session.userId = undefined!;

      const idPromise: UserId = await getUserIdFromSession(request.session, false);
      expect(spies?.get(request.session.save)).toHaveBeenCalled();
      expect(validateUuid(idPromise)).toEqual(true);
    });
});


describe('createRandomIdAndSave', () => {
  beforeEach((context: SessionDataTestContext) => createContextForSessionTest(context));

  test<SessionDataTestContext>('Should generate an id and then call save on the promise',
    async(context) => {
      const userIdNamespace = v5(context.task.name, nilUuid);
      setUserIdNamespace(userIdNamespace);

      const { request, spies } = createTestRequestSessionData(context, {}, {
        spyOnSave: true,
      });

      const session = request.session;
      session.userId = undefined!;
      const newId: UserId = await createRandomIdAndSave(session);
      expect(spies?.get(session.save)).toHaveBeenCalled();
      expect(newId).not.toBeUndefined();
      expect(validateUuid(newId)).toEqual(true);

      await expect(createRandomIdAndSave(session)).resolves.not.toBeUndefined();
    });

  test<SessionDataTestContext>('Should throw an error occuring while saving a session with new id',
    async(context) => {
      const userIdNamespace = v5(context.task.name, nilUuid);
      setUserIdNamespace(userIdNamespace);

      const { request } = createTestRequestSessionData(context);

      const session = request.session;
      session.save = vi.fn((cb) => {
        const err = new Error('Test Error');
        cb!(err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      session.userId = undefined!;

      await expect(createRandomIdAndSave(session)).rejects.toThrow(expect.any(Error));
    });
});
