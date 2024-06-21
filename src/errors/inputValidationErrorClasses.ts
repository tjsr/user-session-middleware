import {
  LOGOUT_FAILED_ERROR,
  USER_INPUT_EMAIL_VALIDATION_ERROR,
  USER_INPUT_VALIDATION_ERROR
} from '../errors/errorCodes.js';

import { EmailAddress } from '../types.js';
import { HttpStatusCode } from '../httpStatusCodes.js';
import { SessionHandlerError } from '../errors/SessionHandlerError.js';

class UserInputValidationError extends SessionHandlerError {
  constructor(sesisonErrorCode = USER_INPUT_VALIDATION_ERROR,
    status = HttpStatusCode.BAD_REQUEST, message?: string) {
    super(sesisonErrorCode, status, message);
    this.name = 'UserInputValidationError';
  }
}

export class EmailValidationError extends UserInputValidationError {
  private _email?: EmailAddress | undefined;

  get email(): EmailAddress | undefined {
    return this._email;
  }

  constructor(message: string, providedEmail?: EmailAddress | undefined) {
    super(USER_INPUT_EMAIL_VALIDATION_ERROR, HttpStatusCode.BAD_REQUEST, message);
    this.name = 'EmailValidationError';
    this._email = providedEmail;
  }
}

export class LoginBodyFormatError extends UserInputValidationError {
  constructor(message: string) {
    super(USER_INPUT_VALIDATION_ERROR, HttpStatusCode.BAD_REQUEST, message);
    this.name = 'LoginBodyFormatError';
  }
}

export class LogoutFailedError extends SessionHandlerError {
  constructor(code: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    message: string = 'Error logging out.', cause?: unknown) {
    super(LOGOUT_FAILED_ERROR, code, message, cause);
  }
}
