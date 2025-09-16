import { IdNamespace } from '../types.ts';
import { SessionMiddlewareError } from './SessionMiddlewareError.ts';

export class UUIDNamespaceSessionMiddlewareError extends SessionMiddlewareError {
  namespaceValue?: IdNamespace;
  constructor(namespace: IdNamespace, message: string) {
    super(message);
    this.namespaceValue = namespace;
  }
}
export class UUIDNamespaceNotDefinedError extends UUIDNamespaceSessionMiddlewareError {
  constructor() {
    super(undefined!, 'USER_UUID_NAMESPACE not set in environment or on USM options.');
  }
}

export class NamespaceUUIDFormatError extends UUIDNamespaceSessionMiddlewareError {
  constructor(namespace: IdNamespace, message = 'Provided Namespace ${namespace} is not a valid UUID.') {
    super(namespace, message);
  }
}

export class NamespaceNotProvidedError extends UUIDNamespaceSessionMiddlewareError {
  constructor(message = 'Namespace must be provided.') {
    super(undefined!, message);
  }
}
