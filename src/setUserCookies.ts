import { Response } from 'express';

export const setUserCookies = (sessionId: string, userId: string,
  displayName: string, response: Response): void => {
  // console.log(`Setting user_id=${userId},displayName=${displayName} in callback for session=${sessionId}`);
  const cookies: Map<string, string> = new Map<string, string>();
  response.header('access-control-expose-headers', 'Set-Cookie');
  cookies.set('user_id', userId);
  cookies.set('displayName', displayName);

  cookies.set('sessionId', sessionId);
  // const cookieArr: string[] = [];
  cookies.forEach((value, key) => {
    // const cookieString = cookieArr.join('; ') + '; Path=/; SameSite=Lax';
    // const cookieString = `${key}=${value}; Path=/; SameSite=Lax`;
    response.cookie(key, value);
    // cookieArr.push(`${key}=${value}`);
  });
};
