import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

import { SESSION_SECRET } from '../getSession.js';
import { SessionId } from '../types.js';

export const generateNewSessionId = (sessionSecret = SESSION_SECRET): SessionId => {
  return uuidv5(uuidv4(), sessionSecret);
};
