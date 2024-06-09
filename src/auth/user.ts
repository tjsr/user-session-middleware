import { EmailAddress, UserId, uuid5 } from '../types.js';

import { createRandomId } from '../utils/createRandomId.js';
import { getUserIdNamespace } from './userNamespace.js';
import { v5 as uuidv5 } from 'uuid';

export const createUserIdFromEmail = (email: EmailAddress): uuid5 => {
  return uuidv5(email, getUserIdNamespace());
};

export const createRandomUserId = (): UserId => {
  return createRandomId(getUserIdNamespace());
};
