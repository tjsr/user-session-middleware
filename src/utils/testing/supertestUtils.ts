import { setSessionCookie } from '@tjsr/testutils';
import supertest from 'supertest';

import { StrictTestSessionOptions, validateContextApp, validateSessionOptions } from './apiTestUtils.ts';
import { SessionTestContext } from './context/session.ts';
import { getSupertestSessionIdCookie } from './cookieTestUtils.ts';
import { ApiTestContext, SupetestTestContext } from '../../api/utils/testcontext.ts';
import { SessionId } from '../../types.ts';

export const doSessionCall = async (
  st: supertest.Test,
  sessionId: SessionId | undefined,
  sessionOptions: StrictTestSessionOptions
): Promise<{ response: supertest.Response; updatedSessionId: SessionId | undefined }> => {
  st.set('Content-Type', 'application/json').accept('application/json');

  if (sessionId) {
    st = setSessionCookie(st, sessionOptions.name, sessionId, sessionOptions.secret);
  }
  const response = await st;

  const updatedSessionId = getSupertestSessionIdCookie(response, sessionOptions.name, sessionOptions.secret);

  return { response, updatedSessionId };
};

const setupSupertestCall = (st: supertest.Test, context: SupetestTestContext): supertest.Test => {
  if (context.applicationType) {
    st.set('Content-Type', context.applicationType);
  }
  if (context.accepts) {
    st.accept(context.accepts);
  }

  if (context.currentSessionId && context.sessionOptions) {
    const options: StrictTestSessionOptions = validateSessionOptions(context.sessionOptions);
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

  const stContext = context as unknown as SupetestTestContext;

  const st = setupSupertestCall(agent, stContext);
  stContext.st = st;

  return agent;
};
