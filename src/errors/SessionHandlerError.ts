import { DEFAULT_ERROR_CODES } from "./defaultErrorCodes.js";

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
}
