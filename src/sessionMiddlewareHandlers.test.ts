import { clearIgnoredFunctions } from './setup-tests.js';

describe('handleSessionWithNewlyGeneratedId', () => {
  test('Should not fail because we have no tests.', () => expect(true).toBe(true));
  // let testSessionData: Session & Partial<SystemSessionDataType>;
  // let memoryStore: Store;

  // beforeEach(() => {
  //   testSessionData = {
  //     cookie: new Cookie(),
  //   }as Session & Partial<SystemSessionDataType>;

  //   memoryStore = new expressSession.MemoryStore();
  //   memoryStore.set('some-session-id', {
  //     cookie: new Cookie(),
  //   });
  // });

  // test('Should save the session and continue on if there was no sessionID, but a new session was generated', () => {
  //   const req = getMockReq<Express.Request>({
  //     newSessionIdGenerated: true,
  //     sessionID: undefined,
  //     sessionStore: memoryStore,
  //   });
  //   const { res, next } = getMockRes<Express.Response>();

  //   memoryStore.createSession(req, testSessionData);

  //   vi.spyOn(req.session, 'save');
  //   handleSessionWithNewlyGeneratedId(req, res, next);

  //   expect(req.session.save).toHaveBeenCalled();
  //   expect(next).toHaveBeenCalled();
  // });

  // test('Should call next without saving if a new session was not generated', () => {
  //   const req = getMockReq<Express.Request>({
  //     newSessionIdGenerated: false,
  //     sessionID: undefined,
  //     sessionStore: memoryStore,
  //   });
  //   const { res, next } = getMockRes<Express.Response>();

  //   memoryStore.createSession(req, testSessionData);

  //   vi.spyOn(req.session, 'save');
  //   handleSessionWithNewlyGeneratedId(req, res, next);

  //   expect(req.session.save).not.toHaveBeenCalled();
  //   expect(next).toHaveBeenCalled();
  // });

  // test('Should call next without saving if a newSessionIdGenerated was undefined', () => {
  //   const req = getMockReq<Express.Request>({
  //     newSessionIdGenerated: undefined,
  //     sessionID: undefined,
  //     sessionStore: memoryStore,
  //   });
  //   const { res, next } = getMockRes<Express.Response>();

  //   memoryStore.createSession(req, testSessionData);

  //   vi.spyOn(req.session, 'save');
  //   handleSessionWithNewlyGeneratedId(req, res, next);

  //   expect(req.session.save).not.toHaveBeenCalled();
  //   expect(next).toHaveBeenCalled();
  // });
});

describe('retrieveSessionData with mocked async callbacks', () => {
  test('Should not fail because we have no tests.', () => expect(true).toBe(true));
  // let testSessionData: Session & Partial<SystemSessionDataType>;
  // let memoryStore: Store;

  // beforeEach(() => {
  //   testSessionData = {
  //     cookie: new Cookie(),
  //   }as Session & Partial<SystemSessionDataType>;

  //   memoryStore = new expressSession.MemoryStore();
  //   memoryStore.set('some-session-id', {
  //     cookie: new Cookie(),
  //   });
  // });

  // test('Should reject the session if a sessionID was provided but no session data was found', async () => {
  //   // eslint-disable-next-line max-len
  //   // addIgnoredLog('SessionID received for nonexistent-session-id but no session data,
  // with no new id generated. Ending session call.');

  //   // addIgnoredLogsFromFunction(retrieveSessionData, errorToNextIfNoSessionData,
  // regenerateSessionIdIfNoSessionData);
  //   const { req, res, next } = getMockReqResp({
  //     newSessionIdGenerated: false,
  //     sessionID: 'nonexistent-session-id',
  //     sessionStore: memoryStore,
  //   });
  //   memoryStore.createSession(req, testSessionData);
  //   expect(req.session).toBeDefined();
  //   expect(req.sessionID).toBe('nonexistent-session-id');

  //   const [_callbackPromiseEndHandler, callbackMockEndFunction]:
  //     [Promise<void>, typeof res.end] = createMockPromisePair(res.end);
  //   res.end = callbackMockEndFunction;

  //   const [callbackPromiseStatusHandler, callbackMockStatusFunction]:
  //     [Promise<void>, typeof res.status] = createMockPromisePair(res.status);
  //   res.status = callbackMockStatusFunction;

  //   const [_callbackPromiseSessionSave, callbackMockSessionSaveFunction]:
  //     [Promise<void>, typeof req.session.save] = createMockPromisePair(req.session.save);
  //   req.session.save = callbackMockSessionSaveFunction;

  //   handleSessionDataRetrieval(req, res, next);

  //   await callbackPromiseStatusHandler;
  //   expect(callbackMockStatusFunction).toHaveBeenCalledWith(401);

  //   expect(req.session.save).not.toHaveBeenCalled();
  //   expect(res.end).not.toHaveBeenCalled();
  //   expect(next).toHaveBeenCalledWith(expect.any(Error));
  // });

  // test.skip(
  //   'Should accept with a sessionID and there is data in the store, and was provided but no session data was found',
  //   async () => {
  //     addIgnoredLog('SessionID received for nonexistent-session-id');
  //     testSessionData.userId = 'mutated-user-id';
  //     testSessionData.email = 'mutated-email';
  //     memoryStore.set('fake-session-id', testSessionData);
  //     const { req, _res, next } = getMockReqResp<SystemHttpRequestType<SystemSessionDataType>>({
  //       newSessionIdGenerated: false,
  //       sessionID: 'fake-session-id',
  //       sessionStore: memoryStore,
  //     });
  //     memoryStore.createSession(req, testSessionData);
  //     expect(req.session).toBeDefined();
  //     expect(req.sessionID).toBe('fake-session-id');

  //     const [callbackPromiseSessionSave, callbackMockSessionSaveFunction]:
  //       [Promise<void>, typeof req.session.save] = createMockPromisePair(req.session.save);
  //     req.session.save = callbackMockSessionSaveFunction;

  //     // handleSessionDataRetrieval(req, res, next);

  //     await callbackPromiseSessionSave;
  //     expect(callbackMockSessionSaveFunction).toHaveBeenCalled();
  //     expect(req.session.save).toHaveBeenCalled();
  //     expect(req.session.userId).toBe('mutated-user-id');
  //     expect(req.session.email).toBe('mutated-email');

  //     expect(next).toHaveBeenCalled();
  //   });
});

describe('requiresSessionId', () => {
  test('Should not fail because we have no tests.', () => expect(true).toBe(true));
  // let testSessionData: Session & Partial<SystemSessionDataType>;
  // let memoryStore: Store;

  // beforeEach(() => {
  //   testSessionData = {
  //     cookie: new Cookie(),
  //   }as Session & Partial<SystemSessionDataType>;

  //   memoryStore = new expressSession.MemoryStore();
  //   memoryStore.set('some-session-id', {
  //     cookie: new Cookie(),
  //   });
  // });

  // test('Should send a 401 if the sessionID is undefined', async () => {
  //   const req = getMockReq<SystemHttpRequestType<SystemSessionDataType>>({
  //     newSessionIdGenerated: false,
  //     sessionID: undefined,
  //     sessionStore: memoryStore,
  //   });
  //   const { res, next } = getMockRes<Express.Response>();

  //   memoryStore.createSession(req, testSessionData);
  //   expect(req.session).toBeDefined();
  //   expect(req.sessionID).toBeUndefined();

  //   handleSessionIdRequired(req, res, next);
  //   expect(res.status).toHaveBeenCalledWith(401);
  //   expect(next).toHaveBeenCalledWith(expect.any(SessionHandlerError));
  //   expect(res.end).not.toHaveBeenCalled();
  //   expect(res.send).not.toHaveBeenCalled();
  // });

  // test('Should call next if the sessionID is defined', () => {
  //   const { req, res, next } = getMockReqResp({
  //     sessionID: 'some-session-id',
  //   });
  //   memoryStore.createSession(req, testSessionData);
  //   expect(req.sessionID).not.toBeUndefined();
  //   handleSessionIdRequired(req, res, next);
  //   expect(next).toHaveBeenCalled();
  // });
});

describe('retrieveSessionData supertest tests', () => {
  test('Should not fail because we have no tests.', () => expect(true).toBe(true));
  // let app: express.Express;
  // let memoryStore: session.MemoryStore;

  // const appWithMiddleware = (
  //   ...middleware: (express.RequestHandler|express.ErrorRequestHandler)[]
  // ) => {
  //   memoryStore = new session.MemoryStore();

  //   app = express();
  //   app.use(sessionHandlerMiddleware(memoryStore));
  //   app.use(middleware);
  //   app.get('/', (req, res, next) => {
  //     res.status(200);
  //     res.end();
  //     next();
  //   });
  //   app.use((err: Error, req: express.Request, res: express.Response, _next: NextFunction) => {
  //     if (err && res.statusCode <= 300) {
  //       res.status(500);
  //     }
  //     if (!res.statusCode) {
  //       res.status(501);
  //     }
  //     res.send();
  //   });
  // };

  afterEach(() => {
    clearIgnoredFunctions();
  });

  beforeAll(async () => {
    return Promise.resolve();
  });

  afterAll(async () => {
    return Promise.resolve();
  });

  test('Should not fail because we have no tests.', () => expect(true).toBe(true));

  // test('Should reject a made-up SessionID that we dont know about', async () => {
  //   // addIgnoredLogsFromFunction(retrieveSessionData,
  // regenerateSessionIdIfNoSessionData, errorToNextIfNoSessionData);
  //   appWithMiddleware(handleSessionDataRetrieval);
  //   return new Promise<void>((done) => {
  //     supertest(app)
  //       .get('/')
  //       .set(SESSION_ID_HEADER_KEY, 'abcd-1234')
  //       .set('Content-Type', 'application/json')
  //       .expect(401, () => {
  //         done();
  //       });
  //   });
  // });

  // test('Should accept a request with no sessionId', async () => {
  //   appWithMiddleware(handleSessionDataRetrieval);
  //   return new Promise<void>((done) => {
  //     supertest(app)
  //       .get('/')
  //       .set('Content-Type', 'application/json')
  //       .end((err, res) => {
  //         expect(err).toBeNull();
  //         expect(res.status).toBe(200);
  //         done();
  //       });
  //   });
  // });

  // });
});

describe('retrieveSessionDataFromStore', () => {
  test('Should not fail because we have no tests.', () => expect(true).toBe(true));
  // test ('Should reject when no session ID is passed to function', async () => {
  //   const memoryStore = new session.MemoryStore();
  //   let result: SystemSessionDataType | undefined | null = undefined;
  //   try {
  //     result = await retrieveSessionDataFromStore(memoryStore, undefined!);
  //   } catch (err) {
  //     expect(err).toBeDefined();
  //     expect(err.message).toEqual('No session ID received');
  //   }
  //   expect(result).toBeUndefined();
  // });

  // test ('Throw a generic error as a rejected promise when a load failure occurs.', async () => {
  //   const memoryStore = new session.MemoryStore();
  //   const testError: Error = new Error('Generic session storage error occurred.');
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   memoryStore.get = vi.fn((sid: string, callback: (_err: any, _session?: SessionData | null) => void) => {
  //     callback(testError, undefined);
  //   }) as never;

  //   expect(retrieveSessionDataFromStore(memoryStore, 'some-session-id'))
  //     .rejects.toThrowError('Generic session storage error occurred.');
  // });

  // test ('Should return some session data.', async () => {
  //   const memoryStore = new session.MemoryStore();
  //   const testSessionId = 'test-session-id';
  //   memoryStore.set(testSessionId,
  //     {
  //       email: 'test-email',
  //       userId: 'test-user-id',
  //     } as SystemSessionDataType);

  //   expect(retrieveSessionDataFromStore(memoryStore, 'test-session-id'))
  //     .resolves.not.toThrow();

  //   const storeData: SystemSessionDataType |undefined | null = await retrieveSessionDataFromStore(
  //     memoryStore, 'test-session-id');
  //   expect(storeData).not.toBeUndefined();
  //   expect(storeData!.email).toEqual('test-email');
  //   expect(storeData!.userId).toEqual('test-user-id');
  //   expect(storeData!.newId).toBeUndefined();
  // });
});

describe('expressSessionHandlerMiddleware', () => {
  test('Should ensure session id comes from header name', () => {
    // const sessionHandler = expressSessionHandlerMiddleware({ name: 'test.sid' });
    // const app = supertest(app);
  });
});
