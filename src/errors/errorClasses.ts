import {
  ERROR_SAVING_SESSION,
  ERROR_SESSION_NOT_INITIALIZED,
  NEW_SESSION_ID_DATA_EXISTS,
  NO_SESSION_DATA_FROM_STORE,
  NO_SESSION_ID_IN_REQUEST,
  NO_SESSION_ID_ON_SESSION,
  REQUIRED_MIDDLEWARE_CALLED_INCORRECTLY,
  REQUIRED_MIDDLEWARE_NOT_CALLED,
  SESSION_ID_TYPE_ERROR,
  SESSION_STORE_NOT_CONFIGURED
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

export class RequiredMiddlewareNotCalledError extends SessionHandlerError {
  constructor (requiredHandler: string, currentHandler: string) {
    super(REQUIRED_MIDDLEWARE_NOT_CALLED, HttpStatusCode.NOT_IMPLEMENTED, 
      `Prerequisite handler ${requiredHandler} not called before ${currentHandler}.`);
  }
}

export class MiddlewareCallOrderError extends SessionHandlerError {
  constructor (message = 'Middleware already called.', cause?: unknown) {
    super(REQUIRED_MIDDLEWARE_CALLED_INCORRECTLY, HttpStatusCode.BAD_GATEWAY, message, cause);
  }
}

export class SessionStoreNotConfiguredError extends SessionHandlerError {
  constructor() {
    super(SESSION_STORE_NOT_CONFIGURED, HttpStatusCode.NOT_IMPLEMENTED, 'Session store not configured in middleware.');
  }
}

export class NoSessionDataFoundError extends SessionHandlerError {
  constructor () {
    super(NO_SESSION_DATA_FROM_STORE, HttpStatusCode.UNAUTHORIZED,
      'SessionID received but no session data, with no new id generated.');
  }
}

export class SessionIDValueMismatch extends SessionHandlerError {
  constructor(requestId: string, sessionId: string) {
    super(SESSION_ID_TYPE_ERROR, HttpStatusCode.NOT_IMPLEMENTED,
      `Session ID values do not match on request and session: ${requestId} !== ${sessionId}`);
  }
}

export class SessionDataNotExpectedError extends SessionHandlerError {
  constructor() {
    super(NEW_SESSION_ID_DATA_EXISTS, HttpStatusCode.UNAUTHORIZED,
      'Session data received for new session ID.');
  }
}
