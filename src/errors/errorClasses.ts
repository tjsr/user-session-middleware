import {
  ERROR_REQUEST_SESSION_NOT_INITIALIZED,
  ERROR_SAVING_SESSION,
  ERROR_SESSION_ID_NOT_GENERATED,
  ERROR_SESSION_NOT_INITIALIZED,
  ERROR_SESSION_VALUES_MISSING,
  NEW_SESSION_ID_DATA_EXISTS,
  NO_SESSION_DATA_FROM_STORE,
  NO_SESSION_ID_IN_REQUEST,
  NO_SESSION_ID_ON_SESSION,
  REQUIRED_MIDDLEWARE_CALLED_INCORRECTLY,
  REQUIRED_MIDDLEWARE_NOT_CALLED,
  SESSION_ID_GENERATION_ERROR,
  SESSION_ID_MISMATCH_ERROR,
  SESSION_ID_TYPE_ERROR,
  SESSION_STORE_NOT_CONFIGURED,
} from "./errorCodes.js";
import { ErrorRequestHandler, Handler } from "../express/index.js";

import { HttpStatusCode } from "../httpStatusCodes.js";
import { SessionHandlerError } from "./SessionHandlerError.js";
import { SessionId } from "../types.js";

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
  constructor (requiredHandler: Handler|ErrorRequestHandler, currentHandler: Handler|ErrorRequestHandler) {
    super(REQUIRED_MIDDLEWARE_NOT_CALLED, HttpStatusCode.NOT_IMPLEMENTED, 
      `Prerequisite handler ${requiredHandler} not called before ${currentHandler}.`);
  }
}

export class MiddlewareCallOrderError extends SessionHandlerError {
  constructor (message = 'Middleware already called.', cause?: unknown) {
    super(REQUIRED_MIDDLEWARE_CALLED_INCORRECTLY, HttpStatusCode.BAD_GATEWAY, message, cause);
  }
}

export class MiddlewareConfigurationError extends SessionHandlerError {
  constructor (message = 'Middleware prerequisite not met.', cause?: unknown) {
    super(REQUIRED_MIDDLEWARE_CALLED_INCORRECTLY, HttpStatusCode.BAD_GATEWAY, message, cause);
  }
}

export class UserRetrieveMustBeAsyncError extends MiddlewareConfigurationError {
  constructor (message = 'User retrieval middleware function must be async.') {
    super(message);
  }
}

export class SessionStoreNotConfiguredError extends SessionHandlerError {
  constructor(handlerChain: (Handler|ErrorRequestHandler)[]) {
    super(SESSION_STORE_NOT_CONFIGURED, HttpStatusCode.NOT_IMPLEMENTED, 'Session store not configured in middleware.');
    super.handlerChain = handlerChain;
  }
}

export class NoSessionDataFoundError extends SessionHandlerError {
  constructor (originalSessionId: SessionId, newSessionId: SessionId) {
    super(NO_SESSION_DATA_FROM_STORE, HttpStatusCode.UNAUTHORIZED,
      `SessionID ${originalSessionId} received but no session data, replaced with ${newSessionId}.`);
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

export class SessionIDNotGeneratedError extends SessionHandlerError {
  constructor() {
    super(ERROR_SESSION_ID_NOT_GENERATED, HttpStatusCode.NOT_IMPLEMENTED,
      'Session ID not generated for request.');
  }
}

export class RegeneratingSessionIdError extends SessionHandlerError {
  constructor(cause: unknown) {
    super(SESSION_ID_GENERATION_ERROR, HttpStatusCode.INTERNAL_SERVER_ERROR,
      'Error regenerating session ID.', cause);
  }
}

export class RegeneratedSessionIdIncorrectError extends SessionHandlerError {
  constructor() {
    super(SESSION_ID_MISMATCH_ERROR, HttpStatusCode.INTERNAL_SERVER_ERROR,
      'Regenerated session.id did not get correctly assigned as new sessionID.');
  }
}

export class SessionNotGeneratedError extends SessionHandlerError {
  constructor() {
    super(ERROR_REQUEST_SESSION_NOT_INITIALIZED, HttpStatusCode.INTERNAL_SERVER_ERROR,
      'Expected session to exist but was undefined on request.');
  }
}

export class SessionSaveError extends SessionHandlerError {
  constructor(cause: Error, message: string = 'Error saving session.') {
    super(ERROR_SAVING_SESSION, HttpStatusCode.INTERNAL_SERVER_ERROR,
      message, cause);
  }
}

export class SessionUserInfoError extends SessionHandlerError {
  constructor(message: string, code: HttpStatusCode = HttpStatusCode.UNAUTHORIZED) {
    super(ERROR_SESSION_VALUES_MISSING, code,
      message);
  }
}
