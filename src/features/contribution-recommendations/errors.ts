export class RecommendationDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecommendationDomainError';
  }
}

export class NoCandidateIssuesError extends RecommendationDomainError {
  constructor(message = 'No open issues are available in the repository context.') {
    super(message);
    this.name = 'NoCandidateIssuesError';
  }
}

export class InvalidRecommendationResponseError extends RecommendationDomainError {
  constructor(
    message: string,
    public readonly rawOutput?: string
  ) {
    super(message);
    this.name = 'InvalidRecommendationResponseError';
  }
}

export class NoSuitableContributionError extends RecommendationDomainError {
  constructor(
    message = 'No suitable contribution opportunities matched the profile criteria.'
  ) {
    super(message);
    this.name = 'NoSuitableContributionError';
  }
}
