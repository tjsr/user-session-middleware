import { EmailAddress, IdNamespace, SessionId } from "../../types.js";

import { Express } from "../../express/index.js";
import { TaskContext } from "vitest";
import { UserModel } from "../../types/model.js";
import { UserSessionOptions } from "../../types/sessionOptions.js";

export interface ApiTestContext extends TaskContext {
  userIdNamespace: IdNamespace;
  sessionOptions: Partial<UserSessionOptions>;
  app?: Express;
  currentSessionId?: SessionId;
  userData: Map<EmailAddress, UserModel|undefined>;
}
