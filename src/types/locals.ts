import { ErrorRequestHandler, Handler, Locals } from '../express/index.js';
import { IdNamespace } from '../types.js';
import { USER_ID_NAMESPACE_KEY } from '../auth/userNamespace.js';

import { UserModel } from './model.js';
import { UserSessionData } from './session.js';

export type AppLocalsWithNamespaceKey = Record<string, unknown> & { [USER_ID_NAMESPACE_KEY]?: IdNamespace | undefined };

export interface ApplicationLocals {
  sessionIdCookieKey?: string | undefined;
  sessionIdHeaderKey?: string | undefined;
}

export interface SystemRequestLocals extends Locals {
  newSessionIdGenerated?: boolean;
  regenerateSessionId?: boolean;
  sessionIdCookieKey?: string | undefined;
  sessionIdHeaderKey?: string | undefined;
}

export interface SystemResponseLocals<SD extends Partial<UserSessionData> = UserSessionData>
  extends Record<string, unknown> {
  calledHandlers?: (Handler | ErrorRequestHandler)[];
  debugCallHandlers?: boolean;
  newSessionIdGenerated?: boolean;
  // session: express.Session & Partial<SessionDataType>;
  regenerateSessionId?: boolean;

  retrievedSessionData?: SD | undefined;
  sendAuthenticationResult?: boolean;
  skipHandlerDependencyChecks?: boolean;
  userAuthenticationData?: UserModel;
}
