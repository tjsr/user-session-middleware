import { ErrorRequestHandler, Handler } from '../express/index.ts';
import { DEFAULT_ERROR_CODES } from './defaultErrorCodes.ts';
import { SessionMiddlewareError } from './SessionMiddlewareError.ts';

export class SessionHandlerError extends SessionMiddlewareError {
  private _clientMessage?: string;

  private _handlerChain?: (Handler | ErrorRequestHandler)[];
  private readonly _sessionErrorCode: number;
  private readonly _status?: number;
  // TODO: Make this constructor protected.
  constructor(sesisonErrorCode: number, status?: number, message?: string, cause?: unknown) {
    super(message);
    this.name =
      (this.constructor.name != 'SessionHandlerError' ? this.constructor.name + ':' : '') + 'SessionHandlerError';
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
  }

  public get clientMessage(): string {
    if (this._clientMessage) {
      return this._clientMessage;
    }
    return this.message;
  }

  public get handlerChain(): (Handler | ErrorRequestHandler)[] | undefined {
    return this._handlerChain;
  }

  public override get message(): string {
    if (super.message === undefined) {
      return super.message;
    }
    const defaultMessage = DEFAULT_ERROR_CODES.get(this._sessionErrorCode)?.message || 'Unknown error';
    return defaultMessage;
  }

  public get status(): number {
    if (this._status) {
      return this._status;
    }
    const defaultCode = DEFAULT_ERROR_CODES.get(this._sessionErrorCode)?.status || 500;
    return defaultCode;
  }

  public set clientMessage(message: string) {
    this._clientMessage = message;
  }

  public set handlerChain(chain: (Handler | ErrorRequestHandler)[]) {
    this._handlerChain = chain;
  }

  static override isType(error: Error): boolean {
    return error.name?.endsWith('SessionHandlerError');
  }
}
