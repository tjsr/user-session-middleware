import { Request, Response } from '../../express/index.js';
import { UserSessionMiddlewareRequestHandler } from '../../types/middlewareHandlerTypes.js';

// export const handleRequestLocalsCreation: UserSessionMiddlewareRequestHandler = <
//   UserSessionData,
//   P = core.ParamsDictionary,
//   ResBody = any,
//   ReqBody = any,
//   ReqQuery = core.Query,
//   Locals = SystemRequestLocals,
// >(
//   request: SystemHttpRequestType<UserSessionData, P, ResBody, ReqBody, ReqQuery, Locals>,
//   _response,
//   next
// ): void => {
// if (!request.locals) {
//   request.locals = {};
// }

export const handleRequestLocalsCreation: UserSessionMiddlewareRequestHandler = (
  _req: Request,
  _resp: Response,
  next
) => {
  // const hk = req.app.locals['sessionIdHeaderKey'];
  // const ck = req.app.locals['sessionIdCookieKey'];
  next();
};
