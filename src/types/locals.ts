import { HandlerName } from "../types.js";
import { SessionStoreDataType } from "./session.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SystemResponseLocals<StoreData extends SessionStoreDataType> extends Record<string, any> {
  calledHandlers: HandlerName[];
  retrievedSessionData: StoreData | undefined;
  skipHandlerDependencyChecks: boolean;
}
