import { EmailAddress, IdNamespace } from '../types.ts';

import { NextFunction } from '../express/index.ts';
import { Session } from '../express-session/index.ts';
import { SystemResponseLocals } from '../types/locals.ts';
import { UserModel } from '../types/model.ts';
import { UserSessionData } from '../types/session.ts';
import { getDbUserByEmail } from './getDbUser.ts';
import { handleLoginAuthenticationFailure } from '../api/login.ts';

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
    console.debug(retrieveUserDataForSession, `User ${email} logged in and has userId`, user.userId);

    locals.userAuthenticationData = user;

    next();
  });
};
