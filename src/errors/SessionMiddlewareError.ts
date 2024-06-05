export class SessionMiddlewareError extends Error {
  constructor (
    message?: string,
    cause?: unknown
  ) {
    super(message);
    this.name = (this.constructor.name != 'SessionMiddlewareError' ? (this.constructor.name + ':') : '') +
     'SessionMiddlewareError';
    if (cause) {
      this.cause = cause;
    }
  };

  static isType(error: Error): boolean {
    return error.name?.endsWith('SessionMiddlewareError');
  }
}
