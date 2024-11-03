export class DeprecatedFunctionError extends Error {
  constructor(methodName: string, caller?: string | undefined, message?: string) {
    super(
      message
        ? message
        : caller
          ? `Method ${methodName} called from ${caller} is deprecated and should not be used`
          : `Method ${methodName} is deprecated and should not be used`
    );
    this.name = 'DeprecatedFunctionError';
  }
}
