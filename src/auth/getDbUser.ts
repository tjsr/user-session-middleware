import { EmailAddress } from '../types.js';
import { UserModel } from '../types/model.js';
import { createUserIdFromEmail } from './user.js';

let retrieveUserData: ((_email: EmailAddress) => Promise<UserModel>) | undefined = undefined;

export const getDbUserByEmail = async (email: EmailAddress): Promise<UserModel> => {
  if (retrieveUserData) {
    return retrieveUserData(email);
  }
  return Promise.resolve({
    email: email,
    userId: createUserIdFromEmail(email),
  });
};

export const setRetrieveUserDataFunction = async (fn: (_email: EmailAddress) => Promise<UserModel>) => {
  retrieveUserData = fn;
};
