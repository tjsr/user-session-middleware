import { IdNamespace } from '../../types.js';
import { TaskContext } from 'vitest';
import express from '../../express/index.js';

export class DeprecatedFunctionError extends Error {
  constructor(methodName: string, caller?: string | undefined, message?: string) {
    super(
      message
        ? message
        : caller
          ? `Method ${methodName} called from ${caller} is deprecated and should not be used`
          : `Method ${methodName} is deprecated and should not be used`
    );
    this.name = 'DeprecatedFunctionError';
  }
}

export type UserIdTaskContext = TaskContext & {
  userIdNamespace: IdNamespace;
};

export type UserAppTaskContext = UserIdTaskContext & {
  app: express.Application;
};
