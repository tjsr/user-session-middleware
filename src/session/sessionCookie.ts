import { SystemHttpRequestType } from '../types/request.js';
import { UserSessionData } from '../types/session.js';
import { UserSessionOptions } from '../types/sessionOptions.js';
import { getSessionOptionsFromRequest } from '../middleware/requestVerifiers.js';

export const getCookieKeyFromRequest = (req: SystemHttpRequestType<UserSessionData>): string => {
  const sessionOptions: UserSessionOptions = getSessionOptionsFromRequest(req);
  return sessionOptions.name!;
};
