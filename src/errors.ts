import { HttpStatusCode } from "./httpStatusCodes.js";

export const INVALID_SESSION_ID_FORMAT = 80001;
export const SESSION_ID_NOT_GENERATED = 80002;
export const NO_SESSION_ID_FOR_NEW_REQUEST_TRUE = 80003;
export const SESSION_ID_TYPE_ERROR = 80004;
export const NO_SESSION_ID_IN_REQUEST = 80101;
export const NO_SESSION_DATA_FROM_STORE = 80102;
export const NO_SESSION_ID_ON_SESSION = 80103;
export const NEW_SESSION_ID_DATA_EXISTS = 80201;
export const ERROR_RETRIEVING_SESSION_DATA = 80202;
export const ERROR_SESSION_NOT_INITIALIZED = 80203;
export const PREREQUISITE_HANDLER_NOT_CALLED = 80204;
export const ERROR_SAVING_SESSION = 80205;

type SessionErrorValueDefaults = {
  status: HttpStatusCode,
  message: string,
};

const DEFAULT_ERROR_CODES: Map<number, SessionErrorValueDefaults> = new Map(
  [
    [INVALID_SESSION_ID_FORMAT, { message: "Invalid session ID format.", status: HttpStatusCode.BAD_REQUEST }],
    [SESSION_ID_NOT_GENERATED, { message: "No session ID in generated.", status: HttpStatusCode.BAD_REQUEST }],
    [NO_SESSION_ID_IN_REQUEST, { message: "No session ID in request.", status: HttpStatusCode.UNAUTHORIZED }],
    [SESSION_ID_TYPE_ERROR, { message: "Session ID is invalid data type.", status: HttpStatusCode.BAD_REQUEST }],
    [NO_SESSION_DATA_FROM_STORE,
      { message: "No session data found for session ID.", status: HttpStatusCode.UNAUTHORIZED }],
    [NO_SESSION_ID_FOR_NEW_REQUEST_TRUE,
      { message: "No sessionID, but got new ID generated on request.", status: HttpStatusCode.BAD_REQUEST }],
    [NEW_SESSION_ID_DATA_EXISTS, {
      message: "New session ID generated but session data already exists - this should never happen.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [ERROR_RETRIEVING_SESSION_DATA, {
      message: "Error getting session data from data store.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [ERROR_SESSION_NOT_INITIALIZED, {
      message: "Session data on request not yet initialized.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [PREREQUISITE_HANDLER_NOT_CALLED, {
      message: "Prerequisite method was not called.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [ERROR_SAVING_SESSION, {
      message: "Error writing session data to store.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    [NO_SESSION_ID_ON_SESSION, {
      message: "Request sessionID not defined on session.",
      status: HttpStatusCode.INTERNAL_SERVER_ERROR }],
  ]
);

export class SessionHandlerError implements Error {
  _name: string;

  public get name(): string {
    return this._name;
  }

  private set name(val: string) {
    this._name = val;
  }

  public get status(): number {
    if (this._status) {
      return this._status;
    }
    const defaultCode = DEFAULT_ERROR_CODES.get(this._sessionErrorCode)?.status || 500;
    return defaultCode;
  }

  public get message(): string {
    if (this._message) {
      return this._message;
    }
    const defaultMessage = DEFAULT_ERROR_CODES.get(this._sessionErrorCode)?.message || 'Unknown error';
    return defaultMessage;
  }

  private readonly _status?: number;
  private readonly _sessionErrorCode: number;
  private readonly _message?: string;
  readonly cause?: unknown;

  constructor (
    sesisonErrorCode: number,
    status?: number,
    message?: string,
    cause?: unknown
  ) {
    this._name = this.constructor.name + ':SessionHandlerError';
    this._sessionErrorCode = sesisonErrorCode;
    if (status) {
      this._status = status;
    }
    if (message) {
      this._message = message;
    }
    if (cause) {
      this.cause = cause;
    }
  };
};

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
