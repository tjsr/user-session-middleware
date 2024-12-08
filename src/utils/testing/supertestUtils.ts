import { ApiTestContext, SupetestTaskContext } from '../../api/utils/testcontext.js';
import { validateContextApp, validateSessionOptions } from './apiTestUtils.js';

import { SessionId } from '../../types.js';
import { SessionTestContext } from './context/session.js';
import { StrictUserSessionOptions } from '../../types/sessionOptions.js';
import { getSupertestSessionIdCookie } from './cookieTestUtils.js';
import { setSessionCookie } from '@tjsr/testutils';
import supertest from 'supertest';

export const doSessionCall = async (
  st: supertest.Test,
  sessionId: SessionId | undefined,
  sessionOptions: StrictUserSessionOptions
): Promise<{ response: supertest.Response; updatedSessionId: SessionId | undefined }> => {
  st.set('Content-Type', 'application/json').accept('application/json');

  if (sessionId) {
    st = setSessionCookie(st, sessionOptions.name, sessionId, sessionOptions.secret);
  }
  const response = await st;

  const updatedSessionId = getSupertestSessionIdCookie(response, sessionOptions.name, sessionOptions.secret);

  return { response, updatedSessionId };
};

const setupSupertestCall = (st: supertest.Test, context: SupetestTaskContext): supertest.Test => {
  if (context.applicationType) {
    st.set('Content-Type', context.applicationType);
  }
  if (context.accepts) {
    st.accept(context.accepts);
  }

  if (context.currentSessionId && context.sessionOptions) {
    const options: StrictUserSessionOptions = validateSessionOptions(context.sessionOptions);
    setSessionCookie(st, options.name, context.currentSessionId, options.secret);
  }
  return st;
};

export const setupSupertestContext = (context: ApiTestContext<SessionTestContext>): supertest.Test => {
  validateContextApp(context);
  if (!context.startingUrl) {
    throw new Error('No starting URL provided for test context.');
  }
  const agent =
    context.requestMethod?.toLowerCase() === 'post'
      ? supertest(context.app).post(context.startingUrl)
      : supertest(context.app).get(context.startingUrl);

  const stContext = context as unknown as SupetestTaskContext;

  const st = setupSupertestCall(agent, stContext);
  stContext.st = st;

  return agent;
};
