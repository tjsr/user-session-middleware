import { HandlerName } from "../types.js";
import { UserSessionData } from "./session.js";

export interface SystemResponseLocals<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SD extends Partial<UserSessionData> = UserSessionData> extends Record<string, any> {
  calledHandlers?: HandlerName[];
  retrievedSessionData?: SD | undefined;
  skipHandlerDependencyChecks?: boolean;
}
