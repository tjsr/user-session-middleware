import { Response } from 'express';

export const COOKIE_USER_ID = 'user_id';
export const COOKIE_DISPLAY_NAME = 'displayName';
export const COOKIE_SESSION_ID = 'sessionId';

export const setUserCookies = (sessionId: string, userId: string,
  displayName: string, response: Response): void => {
  // console.log(`Setting user_id=${userId},displayName=${displayName} in callback for session=${sessionId}`);
  const cookies: Map<string, string> = new Map<string, string>();
  response.header('access-control-expose-headers', 'Set-Cookie');
  cookies.set(COOKIE_USER_ID, userId);
  cookies.set(COOKIE_DISPLAY_NAME, displayName);

  cookies.set(COOKIE_SESSION_ID, sessionId);
  // const cookieArr: string[] = [];
  cookies.forEach((value, key) => {
    // const cookieString = cookieArr.join('; ') + '; Path=/; SameSite=Lax';
    // const cookieString = `${key}=${value}; Path=/; SameSite=Lax`;
    response.cookie(key, value);
    // cookieArr.push(`${key}=${value}`);
  });
};
