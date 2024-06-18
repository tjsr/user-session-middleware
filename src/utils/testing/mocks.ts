import { Cookie, SessionData } from "../../express-session/index.js";

import { createUserIdFromEmail } from "../../auth/user.js";

export const mockSession = (overrides?: Partial<SessionData>): SessionData => {
  const email = overrides?.email ?? 'test@example.com';
  const userId = overrides?.userId ?? createUserIdFromEmail(email);
  return {
    cookie: new Cookie(),
    email: email,
    hasLoggedOut: overrides?.hasLoggedOut ?? false,
    newId: overrides?.newId ?? false,
    userId: userId,
  };
};
