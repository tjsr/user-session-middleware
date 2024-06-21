import { describe, expect, test } from "vitest";

import { getSessionIdFromSetCookieString } from "./cookieTestUtils.js";

describe('getSessionIdFromSetCookieString', () => {
  test('Should return a sessionId value in a string with path.', () => {
    const testString = 'sessionId=d569a638-3fec-4e29-9b86-52f006ca45e4; Path=/; HttpOnly; SameSite=Strict';

    expect(getSessionIdFromSetCookieString(testString)).toEqual('d569a638-3fec-4e29-9b86-52f006ca45e4');
  });
});
