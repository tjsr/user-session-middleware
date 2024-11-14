import { IdNamespace } from "../types.js";
import expressSession from "express-session";

type Path = string;
export interface UserSessionOptions extends expressSession.SessionOptions {
  debugCallHandlers?: boolean;

  // Don't bind the /login and /logout endpoints
  disableLoginEndpoints?: boolean | undefined;

  // Don't permit a session ID to be renewed by calling /session
  disableSessionRefresh?: boolean | undefined;

  loginPath?: Path;
  logoutPath?: Path;
  // Return a 401 if the session id is not recognized in store
  rejectUnrecognizedSessionId?: boolean | undefined;

  sessionPath?: Path;

  // Don't set * as the Access-Control-Allow-Origin header
  skipExposeHeaders?: boolean | undefined;

  // Look for the session id in the X-Session-Id header
  useForwardedSessions?: boolean | undefined;

  // The UUID namespace to separate out generated User IDs to ensure unuqieness across systems.
  userIdNamespace?: IdNamespace | undefined;

  usmVersion?: number | undefined;
  // Check and throw an error if a middleware call that's expected didn't occur
  validateMiddlewareDependencies?: boolean | undefined;
}
