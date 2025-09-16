import { SessionTestContext, setupSessionContext } from '../../utils/testing/context/session.ts';
import { createContextForSessionTest, createMockPromisePair, createTestRequestSessionData } from '../../testUtils.ts';

import { SessionDataTestContext } from '../../api/utils/testcontext.ts';
import { SessionEnabledRequestContext } from '../../utils/testing/context/request.ts';
import { SessionHandlerError } from '../../errors/SessionHandlerError.ts';
import { TaskContext } from 'vitest';
import { handleSessionWithNewlyGeneratedId } from './handleSessionWithNewlyGeneratedId.ts';
import { setupExpressContext } from '../../utils/testing/context/appLocals.ts';

describe<SessionDataTestContext>('handler.handleSessionWithNewlyGeneratedId', () => {
  beforeEach((context: SessionDataTestContext & SessionTestContext & TaskContext) => {
    setupSessionContext(context);
    createContextForSessionTest(context);
    setupExpressContext(context);
  });

  test<SessionEnabledRequestContext>('Should call next when a session is newly generated.', async (context) => {
    const { next, request, response } = createTestRequestSessionData(
      context,
      {
        newSessionIdGenerated: true,
        sessionID: 'session-1234',
      },
      {
        noMockSave: true,
      }
    );

    const [nextPromise, nextMock] = createMockPromisePair(next);

    handleSessionWithNewlyGeneratedId(request, response, nextMock);
    console.debug('Awaiting next promise...');
    await nextPromise;
    expect(nextMock).toHaveBeenCalledWith();
  });

  test<SessionEnabledRequestContext>('Should call to error handler and not call save if session was not initialized.', (context) => {
    const { next, request, response } = createTestRequestSessionData(
      context,
      {
        sessionID: 'session-2345',
      },
      { skipCreateSession: true }
    );

    context.testRequestData['new'] = true;
    handleSessionWithNewlyGeneratedId(request, response, next);
    expect(next).toHaveBeenCalledWith(expect.any(SessionHandlerError));
    expect(next).not.toHaveBeenCalledWith();
    expect(request.session).toBeUndefined();
  });
});
