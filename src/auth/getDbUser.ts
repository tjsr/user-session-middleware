import { createUserIdFromEmail, retrieveUserData } from './user.js';

import { EmailAddress } from '../types.js';
import { UserModel } from '../types/model.js';

export const getDbUserByEmail = async (email: EmailAddress): Promise<UserModel> => {
  if (retrieveUserData) {
    return retrieveUserData(email);
  }
  return Promise.resolve({
    email: email,
    userId: createUserIdFromEmail(email),
  });
};
