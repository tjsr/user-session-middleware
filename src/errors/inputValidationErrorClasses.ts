import {
  USER_AUTHENTICATION_ERROR,
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

export class AuthenticationError extends SessionHandlerError {
  constructor(cause?: Error) {
    super(USER_AUTHENTICATION_ERROR, HttpStatusCode.FORBIDDEN, 'Authentication error', cause);
    this.name = 'AuthenticationError';
  }
}

export class UnknownAuthenticationError extends SessionHandlerError {
  constructor(cause: unknown) {
    super(USER_AUTHENTICATION_ERROR, HttpStatusCode.INTERNAL_SERVER_ERROR, 'Unknown authentication error', cause);
    this.name = 'UnknownAuthenticationError';
  }
}

export class LoginBodyFormatError extends UserInputValidationError {
  constructor(message: string) {
    super(USER_INPUT_VALIDATION_ERROR, HttpStatusCode.BAD_REQUEST, message);
    this.name = 'LoginBodyFormatError';
  }
}
