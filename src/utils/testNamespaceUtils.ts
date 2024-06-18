import { IdNamespace } from "../types.js";
import { NIL_UUID } from "../testUtils.js";
import { TaskContext } from "vitest";
import { setUserIdNamespace } from "../auth/userNamespace.js";
import { v5 } from "uuid";

export const createTestRunNamespace = (contextName: string): IdNamespace => {
  return v5(contextName, NIL_UUID);
};

export const setUserIdNamespaceForTest = (context: TaskContext): IdNamespace => {
  const userIdNamespace: IdNamespace = v5(context.task.name, NIL_UUID);
  return setUserIdNamespace(userIdNamespace);
};
