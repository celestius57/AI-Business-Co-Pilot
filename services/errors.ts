export class ServiceError extends Error {
  public userMessage: string;
  public originalError: unknown;

  constructor(userMessage: string, originalError?: unknown) {
    super(userMessage);
    this.name = 'ServiceError';
    this.userMessage = userMessage;
    this.originalError = originalError;
  }
}
