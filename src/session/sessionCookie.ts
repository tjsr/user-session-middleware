import { SystemHttpRequestType } from '../types/request.ts';
import { UserSessionData } from '../types/session.ts';
import { UserSessionOptions } from '../types/sessionOptions.ts';
import { getSessionOptionsFromRequest } from '../middleware/requestVerifiers.ts';

export const getCookieKeyFromRequest = (req: SystemHttpRequestType<UserSessionData>): string => {
  const sessionOptions: UserSessionOptions = getSessionOptionsFromRequest(req);
  return sessionOptions.name!;
};
