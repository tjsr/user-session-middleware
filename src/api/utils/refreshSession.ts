import { ApiTestContext } from './testcontext.js';
import { SessionId } from '../../types.js';
import { getSupertestSessionIdCookie } from '../../utils/testing/cookieTestUtils.js';
import { setSessionCookie } from '@tjsr/testutils';
import supertest from 'supertest';

export const refreshSession = async (context: ApiTestContext, sessionId: SessionId): Promise<supertest.Response> => {
  expect(context.sessionOptions?.name).not.toBeUndefined();
  expect(context.sessionOptions?.secret).not.toBeUndefined();

  let st = supertest(context.app).get('/session');

  st.set('Content-Type', 'application/json').accept('application/json');

  if (sessionId) {
    st = setSessionCookie(st, context.sessionOptions.name!, sessionId, context.sessionOptions.secret);
  }

  const response = await st;
  const updatedSessionId = getSupertestSessionIdCookie(
    response,
    context.sessionOptions.name!,
    context.sessionOptions.secret
  );
  if (updatedSessionId) {
    context.currentSessionId = updatedSessionId;
  }

  return response;
};

export const beginSession = async (context: ApiTestContext): Promise<supertest.Response> => {
  return refreshSession(context, undefined! as SessionId);
};
