/**
 * Typed domain errors for repository assistant operations.
 */

export class RepositoryAssistantError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryAssistantError';
  }
}

export class RepositoryAssistantConfigurationError extends RepositoryAssistantError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryAssistantConfigurationError';
  }
}

export class RepositoryAssistantInitializationError extends RepositoryAssistantError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryAssistantInitializationError';
  }
}

export class RepositoryAssistantIndexingError extends RepositoryAssistantError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryAssistantIndexingError';
  }
}

export class RepositoryAssistantTokenError extends RepositoryAssistantError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryAssistantTokenError';
  }
}

export class RepositoryAssistantTokenExpiredError extends RepositoryAssistantError {
  constructor(message: string = 'Conversation session expired. Please start a new chat.', options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryAssistantTokenExpiredError';
  }
}

export class RepositoryAssistantProviderError extends RepositoryAssistantError {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryAssistantProviderError';
    this.statusCode = statusCode;
  }
}

export class RepositoryAssistantTimeoutError extends RepositoryAssistantError {
  constructor(message: string = 'Assistant request timed out.', options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryAssistantTimeoutError';
  }
}

export class RepositoryAssistantInvalidResponseError extends RepositoryAssistantError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryAssistantInvalidResponseError';
  }
}
