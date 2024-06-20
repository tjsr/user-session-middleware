import { Express } from "../../express/index.js";
import { IdNamespace } from "../../types.js";
import { TaskContext } from "vitest";
import { UserSessionOptions } from "../../types/sessionOptions.js";

export interface ApiTestContext extends TaskContext {
  userIdNamespace: IdNamespace;
  sessionOptions: Partial<UserSessionOptions>;
  app?: Express;
}
