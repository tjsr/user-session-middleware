import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

import { SESSION_SECRET } from '../getSession.ts';
import { SessionId } from '../types.ts';

export const generateNewSessionId = (sessionSecret = SESSION_SECRET): SessionId => {
  return uuidv5(uuidv4(), sessionSecret);
};
