import expressSession from "express-session";

export interface UserSessionOptions extends expressSession.SessionOptions {
  // Return a 401 if the session id is not recognized in store
  rejectUnrecognizedSessionId?: boolean | undefined;

  // Check and throw an error if a middleware call that's expected didn't occur
  validateMiddlewareDependencies?: boolean | undefined;

  // Don't set * as the Access-Control-Allow-Origin header
  skipExposeHeaders?: boolean | undefined;

  // Look for the session id in the X-Session-Id header
  useForwardedSessions?: boolean | undefined;
}
