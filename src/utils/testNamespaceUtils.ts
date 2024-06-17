import { IdNamespace } from "../types.js";
import { NIL_UUID } from "../testUtils.js";
import { TaskContext } from "vitest";
import { setUserIdNamespace } from "../auth/userNamespace.js";
import { v5 } from "uuid";

export const createTestRunNamespace = (contextName: string): IdNamespace => {
  return v5(contextName, NIL_UUID);
};

export const setUserIdNamespaceForTest = (context: TaskContext): void => {
  const userIdNamespace = v5(context.task.name, NIL_UUID);
  setUserIdNamespace(userIdNamespace);
};
