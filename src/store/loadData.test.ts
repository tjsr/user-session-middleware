import { describe, expect, test, vi } from "vitest";
import session, { SessionData } from "express-session";

import { retrieveSessionDataFromStore } from "./loadData.js";

describe('retrieveSessionDataFromStore', () => {
  test ('Throw a generic error as a rejected promise when a load failure occurs.', async () => {
    const memoryStore = new session.MemoryStore();
    const testError: Error = new Error('Generic session storage error occurred.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memoryStore.get = vi.fn((sid: string, callback: (_err: any, _session?: SessionData | null) => void) => {
      callback(testError, undefined);
    }) as never;

    expect(retrieveSessionDataFromStore(memoryStore, 'some-session-id'))
      .rejects.toThrowError('Generic session storage error occurred.');
  });
});
