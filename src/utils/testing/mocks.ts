import { Cookie, SessionData, SessionOptions } from '../../express-session/index.js';

import { IdNamespace } from '../../types.js';
import { createResponseLocals } from '../../middleware/handlers/handleLocalsCreation.js';
import { createUserIdFromEmail } from '../../auth/user.js';
import express from '../../express/index.js';

export const mockSession = (userIdNamespace: IdNamespace, overrides?: Partial<SessionData>): SessionData => {
  assert(userIdNamespace !== undefined);

  const email = overrides?.email ?? 'test@example.com';
  const userId =
    overrides?.userId ?? (overrides?.userId === null ? undefined! : createUserIdFromEmail(userIdNamespace, email));
  return {
    cookie: new Cookie(),
    email: email,
    hasLoggedOut: overrides?.hasLoggedOut ?? false,
    newId: overrides?.newId ?? false,
    userId: userId,
  };
};

export const mockExpress = (sessionOptions: SessionOptions): express.Application => {
  const app: express.Application = express();
  app.locals = createResponseLocals(app.locals, { sessionOptions: sessionOptions });
  return app;
};
