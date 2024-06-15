import { EmailAddress } from "../types.js";

export type AuthenticationRestResult = {
  email: EmailAddress | undefined;
  isLoggedIn: boolean;
  message?: string;
  sessionId?: string;
};

