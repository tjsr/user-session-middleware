import {
  ERROR_SAVING_SESSION,
  ERROR_SESSION_NOT_INITIALIZED,
  NO_SESSION_ID_IN_REQUEST,
  NO_SESSION_ID_ON_SESSION,
  SESSION_ID_TYPE_ERROR
} from "./errorCodes.js";

import { HttpStatusCode } from "../httpStatusCodes.js";
import { SessionHandlerError } from "./SessionHandlerError.js";

export class SaveSessionError extends SessionHandlerError {
  constructor (message = 'Error writing session data to store.', cause?: unknown) {
    super(ERROR_SAVING_SESSION, HttpStatusCode.INTERNAL_SERVER_ERROR, message, cause);
  }
}

export class SessionIdTypeError extends SessionHandlerError {
  constructor (message = 'Session ID defined on session is not a uuid when assigning userId.', cause?: unknown) {
    super(SESSION_ID_TYPE_ERROR, HttpStatusCode.BAD_REQUEST, message, cause);
  }
}

export class SessionIdRequiredError extends SessionHandlerError {
  constructor (message = 'Session ID defined on session is not a uuid when assigning userId.', cause?: unknown) {
    super(NO_SESSION_ID_ON_SESSION, HttpStatusCode.BAD_REQUEST, message, cause);
  }
}

export class RequestSessionIdRequiredError extends SessionHandlerError {
  constructor (message = 'Request sessionID not defined on request.', cause?: unknown) {
    super(NO_SESSION_ID_IN_REQUEST, HttpStatusCode.BAD_REQUEST, message, cause);
  }
}

export class SessionDataNotFoundError extends SessionHandlerError {
  constructor (message = 'No session data found for session ID.', cause?: unknown) {
    super(ERROR_SESSION_NOT_INITIALIZED, HttpStatusCode.INTERNAL_SERVER_ERROR, message, cause);
  }
}

export class AssignUserIdError extends SessionHandlerError {
  constructor (message = 'Error assigning userId to session.', cause?: unknown) {
    super(ERROR_SESSION_NOT_INITIALIZED, HttpStatusCode.INTERNAL_SERVER_ERROR, message, cause);
  }
}
