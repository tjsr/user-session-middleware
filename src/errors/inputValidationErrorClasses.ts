import { EmailAddress, SessionId } from '../types.ts';
import {
  LOGOUT_FAILED_ERROR,
  USER_INPUT_EMAIL_VALIDATION_ERROR,
  USER_INPUT_VALIDATION_ERROR,
} from '../errors/errorCodes.ts';

import { HttpStatusCode } from '../httpStatusCodes.ts';
import { SessionHandlerError } from '../errors/SessionHandlerError.ts';

class UserInputValidationError extends SessionHandlerError {
  constructor(sesisonErrorCode = USER_INPUT_VALIDATION_ERROR, status = HttpStatusCode.BAD_REQUEST, message?: string) {
    super(sesisonErrorCode, status, message);
    this.name = 'UserInputValidationError';
  }
}

export class EmailValidationError extends UserInputValidationError {
  private _email?: EmailAddress | undefined;

  constructor(message: string, providedEmail?: EmailAddress | undefined) {
    super(USER_INPUT_EMAIL_VALIDATION_ERROR, HttpStatusCode.BAD_REQUEST, message);
    this.name = 'EmailValidationError';
    this._email = providedEmail;
  }
  get email(): EmailAddress | undefined {
    return this._email;
  }
}

export class NoEmailError extends EmailValidationError {
  _contextName: string | undefined;
  _sessionId: SessionId;
  constructor(sessionId: SessionId, contextName?: string) {
    super('No email provided.');
    this.name = 'NoEmailError';
    this._sessionId = sessionId;
    this._contextName = contextName;
  }
}

export class LoginBodyFormatError extends UserInputValidationError {
  constructor(message: string) {
    super(USER_INPUT_VALIDATION_ERROR, HttpStatusCode.BAD_REQUEST, message);
    this.name = 'LoginBodyFormatError';
  }
}

export class LogoutFailedError extends SessionHandlerError {
  constructor(
    code: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    message: string = 'Error logging out.',
    cause?: unknown
  ) {
    super(LOGOUT_FAILED_ERROR, code, message, cause);
  }
}
