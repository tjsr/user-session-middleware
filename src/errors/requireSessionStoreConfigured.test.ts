import { MemoryStore, Store } from '../express-session/index.ts';

import { SessionStoreNotConfiguredError } from './errorClasses.ts';
import { requireSessionStoreConfigured } from './sessionErrorChecks.ts';

describe('requireSessionStoreConfigured', () => {
  const testHandler = () => {};

  const handlerChain = [testHandler];
  test('Should throw an error if sessionStore is undefined', () => {
    const sessionStore: Store | undefined = undefined;
    const act = () => requireSessionStoreConfigured(sessionStore, handlerChain);
    expect(act).toThrow(expect.any(SessionStoreNotConfiguredError));
  });

  test('Should not throw an error if sessionStore is passed', () => {
    const sessionStore: Store | undefined = new MemoryStore();
    const act = () => requireSessionStoreConfigured(sessionStore, handlerChain);
    expect(act).not.toThrow();
  });
});
