import { EmailAddress, IdNamespace } from '../types.js';
import { handleLoginAuthenticationFailure, login } from '../api/login.js';

import { NextFunction } from '../express/index.js';
import { Session } from '../express-session/index.js';
import { SystemResponseLocals } from '../types/locals.js';
import { UserModel } from '../types/model.js';
import { UserSessionData } from '../types/session.js';
import { getDbUserByEmail } from './getDbUser.js';

export const retrieveUserDataForSession = (
  userIdNamespace: IdNamespace,
  email: EmailAddress,
  session: Session,
  locals: SystemResponseLocals<UserSessionData>,
  next: NextFunction
) => {
  return getDbUserByEmail(userIdNamespace, email).then((user: UserModel) => {
    assert(userIdNamespace !== undefined);
    assert(email !== undefined);

    locals.sendAuthenticationResult = true;
    if (!user) {
      // This calls to next regardless of what happens.
      handleLoginAuthenticationFailure(locals, session, next);
      return;
    }

    session.userId = user.userId;
    session.email = email;
    console.debug(login, `User ${email} logged in and has userId`, user.userId);

    locals.userAuthenticationData = user;

    next();
  });
};
