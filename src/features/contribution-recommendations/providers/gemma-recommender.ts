import 'server-only';
import { BackboardClient } from 'backboard-sdk';
import { DeveloperProfile } from '../../developer-profile/types';
import { RepositoryAnalysis } from '../../repository-analysis/types';
import { RepositoryContext } from '../../repository-context/types';
import {
  BackboardConfig,
  getBackboardConfig,
} from '../../repository-analysis/providers/backboard/backboard-config';
import { BackboardClientLike } from '../../repository-analysis/providers/backboard/backboard-analyzer';
import {
  AiInvalidResponseError,
  AiModelUnavailableError,
  AiProviderError,
  AiRateLimitError,
  AiTimeoutError,
} from '../../repository-analysis/errors';
import {
  ContributionRecommendation,
  ContributionRecommender,
  RecommendationCandidate,
  RecommenderOptions,
} from '../types';
import { RECOMMENDATION_SYSTEM_PROMPT } from '../prompts/system-prompt';
import { buildRecommendationUserPrompt } from '../prompts/recommendation-prompt';
import { parseRawRecommendationResponse } from '../parsing/parse-recommendation-response';
import { validateAndGroundRecommendations } from '../parsing/validate-recommendations';
import { RawRecommendationsResponse } from '../schema';
import { withAiSpan } from '../../observability';

export class GemmaContributionRecommender implements ContributionRecommender {
  private readonly client: BackboardClientLike;
  private readonly config: BackboardConfig;

  constructor(
    config?: Partial<BackboardConfig>,
    customClient?: BackboardClientLike
  ) {
    this.config = {
      ...(config ? ({} as BackboardConfig) : getBackboardConfig()),
      ...config,
    };

    if (customClient) {
      this.client = customClient;
    } else {
      this.client = new BackboardClient({
        apiKey: this.config.apiKey,
        timeout: this.config.timeoutMs,
      });
    }
  }

  async recommend(
    profile: DeveloperProfile,
    analysis: RepositoryAnalysis,
    candidates: RecommendationCandidate[],
    context: RepositoryContext,
    options?: RecommenderOptions
  ): Promise<ContributionRecommendation[]> {
    if (options?.signal?.aborted) {
      throw new AiTimeoutError('Recommendation aborted by caller signal.');
    }

    if (candidates.length === 0) {
      return [];
    }

    const userPrompt = buildRecommendationUserPrompt(
      profile,
      analysis,
      candidates,
      context
    );

    return withAiSpan(
      {
        name: 'Gemma contribution recommendation',
        model: this.config.modelName,
        system: 'openrouter',
        operationType: 'ai_client',
        attributes: {
          'openmate.recommendation.candidate_count': candidates.length,
        },
      },
      async (aiSpan) => {
        let rawOutput: string;
        try {
          const response = await this.client.sendMessage({
            content: userPrompt,
            system_prompt: RECOMMENDATION_SYSTEM_PROMPT,
            llm_provider: this.config.modelProvider,
            model_name: this.config.modelName,
            stream: false,
            memory: 'off',
            web_search: 'off',
            json_output: true,
          });

          this.extractAndRecordMetadata(response, aiSpan);
          rawOutput = this.extractResponseText(response);
        } catch (err: unknown) {
          this.mapAndRethrowError(err);
        }

        if (options?.signal?.aborted) {
          throw new AiTimeoutError('Recommendation aborted by caller signal.');
        }

        let parsedResponse: RawRecommendationsResponse;
        try {
          parsedResponse = parseRawRecommendationResponse(rawOutput);
        } catch (err) {
          // Execute at most one controlled repair attempt if output has JSON markers
          if (rawOutput.includes('{') && rawOutput.includes('}')) {
            aiSpan.recordRepair(true);
            try {
              parsedResponse = await this.attemptControlledRepair(
                rawOutput,
                err instanceof Error ? err.message : String(err),
                aiSpan
              );
              aiSpan.recordRepair(true, true);
            } catch (repairError) {
              aiSpan.recordRepair(true, false);
              throw repairError;
            }
          } else {
            throw err;
          }
        }

        // Ground and validate recommendations against application and context data
        const validated = validateAndGroundRecommendations(
          parsedResponse,
          candidates,
          profile,
          context
        );

        aiSpan.setAttribute('openmate.recommendation.result_count', validated.length);
        return validated;
      }
    );
  }

  private extractAndRecordMetadata(
    response: unknown,
    aiSpan: {
      recordTokenUsage: (usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number }) => void;
      setResponseModel: (model: string) => void;
    }
  ): void {
    if (!response || typeof response !== 'object') return;
    const resObj = response as Record<string, unknown>;

    if (Array.isArray(resObj.messages) && resObj.messages.length > 0) {
      const last = resObj.messages[resObj.messages.length - 1] as Record<string, unknown> | undefined;
      if (last) {
        if (typeof last.modelName === 'string') {
          aiSpan.setResponseModel(last.modelName);
        }
        aiSpan.recordTokenUsage({
          inputTokens: typeof last.inputTokens === 'number' ? last.inputTokens : undefined,
          outputTokens: typeof last.outputTokens === 'number' ? last.outputTokens : undefined,
          totalTokens: typeof last.totalTokens === 'number' ? last.totalTokens : undefined,
        });
      }
    }
  }

  private extractResponseText(response: unknown): string {
    if (!response || typeof response !== 'object') {
      if (typeof response === 'string') {
        return response;
      }
      throw new AiInvalidResponseError('Empty or invalid response from recommendation model.');
    }

    const resObj = response as Record<string, unknown>;

    if (Array.isArray(resObj.messages) && resObj.messages.length > 0) {
      const last = resObj.messages[resObj.messages.length - 1] as
        | Record<string, unknown>
        | undefined;
      const text = last?.content ?? last?.message;
      if (typeof text === 'string') {
        return text;
      }
    }

    if (typeof resObj.content === 'string') {
      return resObj.content;
    }

    if (typeof resObj.message === 'string') {
      return resObj.message;
    }

    throw new AiInvalidResponseError(
      'Could not extract text content from recommendation model response.',
      JSON.stringify(response).slice(0, 100)
    );
  }

  private async attemptControlledRepair(
    invalidOutput: string,
    validationError: string,
    aiSpan?: {
      recordTokenUsage: (usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number }) => void;
      setResponseModel: (model: string) => void;
    }
  ): Promise<RawRecommendationsResponse> {
    const repairPrompt = `Your previous JSON output failed validation with the following error:\n${validationError}\n\nPlease repair the JSON to strictly conform to the required recommendations schema:\n${invalidOutput.slice(0, 10_000)}\n\nOutput ONLY the repaired valid JSON object.`;

    try {
      const response = await this.client.sendMessage({
        content: repairPrompt,
        system_prompt: RECOMMENDATION_SYSTEM_PROMPT,
        llm_provider: this.config.modelProvider,
        model_name: this.config.modelName,
        stream: false,
        memory: 'off',
        web_search: 'off',
        json_output: true,
      });

      if (aiSpan) {
        this.extractAndRecordMetadata(response, aiSpan);
      }

      const repairedText = this.extractResponseText(response);
      return parseRawRecommendationResponse(repairedText);
    } catch (repairErr: unknown) {
      this.mapAndRethrowError(repairErr);
    }
  }

  private mapAndRethrowError(err: unknown): never {
    const errObj =
      typeof err === 'object' && err !== null
        ? (err as Record<string, unknown>)
        : null;

    const rawMessage =
      typeof errObj?.message === 'string'
        ? errObj.message
        : err instanceof Error
          ? err.message
          : String(err);

    const msg = rawMessage.toLowerCase();
    const status = errObj?.statusCode ?? errObj?.status;

    if (status === 429 || msg.includes('rate limit')) {
      throw new AiRateLimitError(rawMessage);
    }

    if (
      status === 404 ||
      msg.includes('model not found') ||
      msg.includes('unavailable')
    ) {
      throw new AiModelUnavailableError(this.config.modelName, rawMessage);
    }

    if (msg.includes('timeout') || msg.includes('etimedout')) {
      throw new AiTimeoutError(rawMessage);
    }

    throw new AiProviderError(
      rawMessage,
      typeof status === 'number' ? status : undefined
    );
  }
}
