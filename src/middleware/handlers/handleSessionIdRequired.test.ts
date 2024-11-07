import { Cookie, MemoryStore, Session } from '../../express-session/index.js';
import { handleSessionCookie, handleSessionCookieOnError } from './handleSessionCookie.js';
import { verifyHandlerFunctionCallsNext, verifyHandlerFunctionCallsNextWithError } from '../../middlewareTestUtils.js';

import { Express } from '../../express/index.js';
import { appWithMiddleware } from '../../utils/testing/middlewareTestUtils.js';
import { getSetCookieString } from '@tjsr/testutils';
import { handleSessionIdRequired } from './handleSessionIdRequired.js';
import supertest from 'supertest';

describe('handler.handleSessionIdRequired', () => {
  test('Should fail when no sessionID is provided.', () =>
    verifyHandlerFunctionCallsNextWithError(handleSessionIdRequired, { sessionID: undefined }));

  test('Should fail when no sessionID is provided.', () =>
    verifyHandlerFunctionCallsNext(handleSessionIdRequired, { sessionID: 'test-session-id' }));
});

describe('api.handleSessionIdRequired', () => {
  let app: Express;
  let memoryStore: MemoryStore;

  beforeEach(() => {
    ({ app, memoryStore } = appWithMiddleware(
      [handleSessionIdRequired, handleSessionCookie, handleSessionCookieOnError],
      undefined,
      { saveUninitialized: true }
    ));
  });

  test('Should accept a request with a valid sessionId.', async () => {
    memoryStore.set('abcd-1234', {
      cookie: new Cookie(),
    } as Session);

    const response = await supertest(app)
      .get('/')
      .set('Set-Cookie', getSetCookieString('cookie.text.sid', 'abcd-1234'))
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.get('Set-Cookie')).not.toBeUndefined();
  });

  test('Should not fail because no sessionId was provided.', async () => {
    // We don't expect an error here because the session generator will assign a new session ID.
    const response = await supertest(app).get('/').set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
  });
});
