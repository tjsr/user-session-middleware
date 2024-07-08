import { ErrorRequestHandler, Handler } from "../express/index.js";

import { UserModel } from "./model.js";
import { UserSessionData } from "./session.js";

export interface SystemResponseLocals<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SD extends Partial<UserSessionData> = UserSessionData> extends Record<string, any> {
  calledHandlers?: (Handler|ErrorRequestHandler)[];
  retrievedSessionData?: SD | undefined;
  skipHandlerDependencyChecks?: boolean;
  sendAuthenticationResult?: boolean;
  userAuthenticationData?: UserModel;
  debugCallHandlers?: boolean;
}
