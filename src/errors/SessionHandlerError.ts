import { DEFAULT_ERROR_CODES } from "./defaultErrorCodes.js";
import { HandlerName } from "../types.js";

export class SessionHandlerError extends Error {
  public get status(): number {
    if (this._status) {
      return this._status;
    }
    const defaultCode = DEFAULT_ERROR_CODES.get(this._sessionErrorCode)?.status || 500;
    return defaultCode;
  }

  public override get message(): string {
    if (this._message) {
      return this._message;
    }
    const defaultMessage = DEFAULT_ERROR_CODES.get(this._sessionErrorCode)?.message || 'Unknown error';
    return defaultMessage;
  }

  public set handlerChain(chain: HandlerName[]) {
    this._handlerChain = chain;
  }

  public get handlerChain(): HandlerName[]|undefined {
    return this._handlerChain;
  }

  private _handlerChain?: HandlerName[];
  private readonly _status?: number;
  private readonly _sessionErrorCode: number;
  private readonly _message?: string;

  constructor (
    sesisonErrorCode: number,
    status?: number,
    message?: string,
    cause?: unknown
  ) {
    super(message);
    this.name = (this.constructor.name != 'SessionHandlerError' ? (this.constructor.name + ':') : '') +
     'SessionHandlerError';
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

  static isType(error: Error): boolean {
    return error.name?.endsWith('SessionHandlerError');
  }
}
