import { LOGOUT_FAILED_ERROR, SESSION_REGENERATION_ERROR, USER_AUTHENTICATION_ERROR } from "./errorCodes.js";

import { HttpStatusCode } from "../httpStatusCodes.js";
import { LogoutFailedError } from "./inputValidationErrorClasses.js";
import { SessionHandlerError } from "./SessionHandlerError.js";

export class AuthenticationError extends SessionHandlerError {
  protected constructor(
    sessionCode: number = USER_AUTHENTICATION_ERROR,
    code: HttpStatusCode = HttpStatusCode.FORBIDDEN,
    message: string = 'Authentication error',
    cause?: Error
  ) {
    super(sessionCode, code, message, cause);
    this.name = 'AuthenticationError';
  }
}

export class LoginCredentialsError extends AuthenticationError {
  constructor(message: string = 'Login credentials invalid.') {
    super(LOGOUT_FAILED_ERROR, HttpStatusCode.FORBIDDEN, message);
  }
}

export class NotLoggedInError extends LogoutFailedError {
  constructor(code: HttpStatusCode = HttpStatusCode.UNAUTHORIZED, message = 'Not logged in.') {
    super(code, message);
  }
}

export class AlreadyLoggedOutError extends NotLoggedInError {
  constructor(message = 'Already logged out.') {
    super(HttpStatusCode.UNAUTHORIZED, message);
  }
}

export class UnknownAuthenticationError extends AuthenticationError {
  constructor(cause: unknown) {
    super(USER_AUTHENTICATION_ERROR, HttpStatusCode.INTERNAL_SERVER_ERROR,
      'Unknown authentication error', cause as Error);
    this.name = 'UnknownAuthenticationError';
  }
}

export class SessionRegenerationFailedError extends SessionHandlerError {
  constructor(cause: unknown) {
    super(SESSION_REGENERATION_ERROR, HttpStatusCode.INTERNAL_SERVER_ERROR,
      'Unknown error regenerating session', cause as Error);
    this.name = 'UnknownAuthenticationError';
  }

}
