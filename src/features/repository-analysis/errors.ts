export class RepositoryAnalysisError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryAnalysisError';
  }
}

export class AiConfigurationError extends RepositoryAnalysisError {
  constructor(message: string = 'AI provider is not configured properly.') {
    super(message);
    this.name = 'AiConfigurationError';
  }
}

export class AiProviderError extends RepositoryAnalysisError {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'AiProviderError';
    this.statusCode = statusCode;
  }
}

export class AiTimeoutError extends RepositoryAnalysisError {
  constructor(message: string = 'AI analysis request timed out.') {
    super(message);
    this.name = 'AiTimeoutError';
  }
}

export class AiRateLimitError extends RepositoryAnalysisError {
  constructor(message: string = 'AI provider rate limit reached. Please try again shortly.') {
    super(message);
    this.name = 'AiRateLimitError';
  }
}

export class AiInvalidResponseError extends RepositoryAnalysisError {
  readonly rawSnippet?: string;

  constructor(message: string, rawSnippet?: string) {
    super(message);
    this.name = 'AiInvalidResponseError';
    this.rawSnippet = rawSnippet;
  }
}

export class AiModelUnavailableError extends RepositoryAnalysisError {
  readonly modelName: string;

  constructor(modelName: string, message?: string) {
    super(
      message ??
        `The requested open-weight model "${modelName}" is currently unavailable. No proprietary fallback is used.`
    );
    this.name = 'AiModelUnavailableError';
    this.modelName = modelName;
  }
}

export class AiContextTooLargeError extends RepositoryAnalysisError {
  constructor(message: string = 'Repository context exceeds model input capacity.') {
    super(message);
    this.name = 'AiContextTooLargeError';
  }
}
