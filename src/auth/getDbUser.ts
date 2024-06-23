import { EmailAddress } from '../types.js';
import { MiddlewareConfigurationError } from '../errors/errorClasses.js';
import { UserModel } from '../types/model.js';
import assert from 'node:assert';
import { createUserIdFromEmail } from './user.js';

export type RetrieveUserDataFn<T extends UserModel = UserModel> = (_email: EmailAddress) => Promise<T>;

let retrieveUserData: RetrieveUserDataFn | undefined = undefined;

// TODO: This needs to return <T extends UserModel> but I'm not sure how to do that.
export const getDbUserByEmail = async <T extends UserModel>(email: EmailAddress): Promise<T> => {
  assert(email !== undefined);
  if (retrieveUserData) {
    return retrieveUserData(email) as Promise<T>;
  }
  return Promise.resolve({
    email: email,
    userId: createUserIdFromEmail(email),
  } as T);
};

const isAsyncFunction = (fn: Function): boolean => {
  return fn && fn.constructor.name === 'AsyncFunction';
};

export const setRetrieveUserDataFunction = <T extends UserModel>(fn: RetrieveUserDataFn<T>) => {
  if (fn !== undefined && !isAsyncFunction(fn)) {
    throw new MiddlewareConfigurationError(`Retrieve user data function must be an async function.`);
  }
  retrieveUserData = fn;
};

export const hasRetrieveUserDataFunction = (): boolean => retrieveUserData !== undefined;
