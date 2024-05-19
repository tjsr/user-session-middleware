import * as Express from 'express';

import { describe, expect, test } from 'vitest';

import { getMockRes } from 'vitest-mock-express';
import { randomUUID } from 'crypto';
import { setUserCookies } from './setUserCookies';

describe('setUserCookies', () => {
  test('Should set cookkies fo basic user data.', () => {
    const { res, mockClear } = getMockRes<Express.Response>();
    mockClear();

    const sessionId = randomUUID();
    const userId = randomUUID();
    const displayName = 'testUser';
    
    setUserCookies(sessionId, userId, displayName, res);
    expect(res.cookie).toHaveBeenCalledWith('sessionId', sessionId);
    expect(res.cookie).toHaveBeenCalledWith('user_id', userId);
    expect(res.cookie).toHaveBeenCalledWith('displayName', displayName);
  });
});
