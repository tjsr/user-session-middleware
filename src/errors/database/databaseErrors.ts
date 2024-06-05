import { SessionMiddlewareError } from "../SessionMiddlewareError.js";

export class SessionDatabaseTableAccessDenied extends SessionMiddlewareError {
  constructor(error: Error) {
    super('Session database table access denied', error);
    this.name = 'SessionDatabaseTableAccessDenied';
  }
}
