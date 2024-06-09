import { SessionMiddlewareError } from './SessionMiddlewareError.js';

export class UUIDNamespaceNotDefinedError extends SessionMiddlewareError {
  constructor() {
    super('USER_UUID_NAMESPACE not set in environment or from application default.');
  }
}
