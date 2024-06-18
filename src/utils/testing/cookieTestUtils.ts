import { COOKIE_WITH_HEADER } from "../../middleware/setSessionCookie.js";
import { Response } from '../../express/index.js';
import { expect } from "vitest";

export const expectSetSessionCookieOnResponseMock = (response: Response, sessionID: string) => {
  if (COOKIE_WITH_HEADER) {
    // expect(response.get('Set-Cookie')).toEqual(`sessionId=${sessionID}`);
    expect(response.set).toBeCalledWith('Set-Cookie', `sessionId=${sessionID}; Path=/; HttpOnly; SameSite=Strict`);
  } else {
    expect(response.cookie).toBeCalledWith('sessionId', sessionID, { httpOnly: true, path: '/', strict: true });
  }
};
