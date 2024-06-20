import { IdNamespace, SessionId } from "../../types.js";

import { Express } from "../../express/index.js";
import { TaskContext } from "vitest";
import { UserSessionOptions } from "../../types/sessionOptions.js";

export interface ApiTestContext extends TaskContext {
  userIdNamespace: IdNamespace;
  sessionOptions: Partial<UserSessionOptions>;
  app?: Express;
  currentSessionId?: SessionId;
}
