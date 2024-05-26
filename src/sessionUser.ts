import { SystemHttpRequestType, SystemSessionDataType, uuid5 } from './types.js';

import { Session } from 'express-session';
import assert from 'assert';
import { getSnowflake } from './snowflake.js';
import { getUuidNamespace } from './getGuidNamespace.js';
import { v5 as uuidv5 } from 'uuid';

const USERID_UUID_NAMESPACE = getUuidNamespace();

export const createRandomUserId = (): uuid5 => {
  return uuidv5(getSnowflake().toString(), USERID_UUID_NAMESPACE);
};

export const assignUserIdToSession = <ApplicationDataType extends SystemSessionDataType>(
  session: Session & Partial<ApplicationDataType>,
  next: () => void
) => {
  if (!session) {
    throw new Error('Session is not defined when assigning userId to session.');
  }
  if (!session.id) {
    throw new Error('Session ID is not defined on session when assigning userId to session.');
  }
  if (!session.userId) {
    const userId: uuid5 = createRandomUserId();
    console.log(assignUserIdToSession,
      `Assigned a new userId ${userId} to session ${session.id}`
    );
    session.userId = userId;
    session.save();
  }
  next();
};

export const assignUserIdToRequestSession = <ApplicationDataType extends SystemSessionDataType>(
  req: SystemHttpRequestType<ApplicationDataType>,
  next: () => void
) => {
  assert(req.session !== undefined);
  assert(typeof req.session.id === 'string');

  assignUserIdToSession(req.session, next);
};
