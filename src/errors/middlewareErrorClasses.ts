import { IdNamespace } from '../types.js';
import { SessionMiddlewareError } from './SessionMiddlewareError.js';

export class UUIDNamespaceSessionMiddlewareError extends SessionMiddlewareError {
  namespaceValue?: IdNamespace;
  constructor(namespace: IdNamespace, message: string) {
    super(message);
    this.namespaceValue = namespace;
  }
}
export class UUIDNamespaceNotDefinedError extends UUIDNamespaceSessionMiddlewareError {
  constructor() {
    super(undefined!, 'USER_UUID_NAMESPACE not set in environment or from application default.');
  }
}

export class NamespaceUUIDFormatError extends UUIDNamespaceSessionMiddlewareError {
  constructor(namespace: IdNamespace, message = 'Provided Namespace ${namespace} is not a valid UUID.') {
    super(namespace, message);
  }
}
