import { DEFAULT_ERROR_CODES } from "./defaultErrorCodes.js";
import { SessionMiddlewareError } from "./SessionMiddlewareError.js";
import { ErrorRequestHandler, Handler } from "../express/index.js";

export class SessionHandlerError extends SessionMiddlewareError {
  public get status(): number {
    if (this._status) {
      return this._status;
    }
    const defaultCode = DEFAULT_ERROR_CODES.get(this._sessionErrorCode)?.status || 500;
    return defaultCode;
  }

  public override get message(): string {
    if (super.message === undefined) {
      return super.message;
    }
    const defaultMessage = DEFAULT_ERROR_CODES.get(this._sessionErrorCode)?.message || 'Unknown error';
    return defaultMessage;
  }

  public set handlerChain(chain: (Handler|ErrorRequestHandler)[]) {
    this._handlerChain = chain;
  }

  public get handlerChain(): (Handler|ErrorRequestHandler)[]|undefined {
    return this._handlerChain;
  }

  public get clientMessage(): string {
    if (this._clientMessage) {
      return this._clientMessage;
    }
    return this.message;
  }

  public set clientMessage(message: string) {
    this._clientMessage = message;
  }

  private _handlerChain?: (Handler|ErrorRequestHandler)[];
  private readonly _status?: number;
  private readonly _sessionErrorCode: number;
  private _clientMessage?: string;

  // TODO: Make this constructor protected.
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
      super.message = message;
    }
    if (cause) {
      this.cause = cause;
    }
  };

  static override isType(error: Error): boolean {
    return error.name?.endsWith('SessionHandlerError');
  }
}
