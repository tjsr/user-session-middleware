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

export class MiddlewareTestContextError extends SessionMiddlewareError {
  constructor(contextType: string, missingDependency?: string) {
    super(
      'Setup of this context requires a valid prerequisite context: ' +
        contextType +
        (missingDependency ? '. Missing dependency: ' + missingDependency : '')
    );
  }
}

export class TestContextMissingAppLocalsError extends MiddlewareTestContextError {
  constructor() {
    super('ApiTestContext', 'app.locals');
  }
}

export class TestContextMissingAppError extends MiddlewareTestContextError {
  constructor() {
    super('ApiTestContext', 'app');
  }
}
