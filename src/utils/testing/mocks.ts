import { Cookie, SessionData } from "../../express-session/index.js";

import { IdNamespace } from '../../types.js';
import { createUserIdFromEmail } from '../../auth/user.js';

export const mockSession = (userIdNamespace: IdNamespace, overrides?: Partial<SessionData>): SessionData => {
  assert(userIdNamespace !== undefined);

  const email = overrides?.email ?? 'test@example.com';
  const userId = overrides?.userId ?? createUserIdFromEmail(userIdNamespace, email);
  return {
    cookie: new Cookie(),
    email: email,
    hasLoggedOut: overrides?.hasLoggedOut ?? false,
    newId: overrides?.newId ?? false,
    userId: userId,
  };
};
