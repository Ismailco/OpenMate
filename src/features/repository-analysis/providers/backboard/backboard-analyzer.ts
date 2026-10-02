import 'server-only';
import { BackboardClient } from 'backboard-sdk';
import { RepositoryContext } from '../../../repository-context/types';
import {
  RepositoryAnalysis,
  RepositoryAnalysisOptions,
  RepositoryAnalyzer,
} from '../../types';
import { RepositoryAnalysisSchema } from '../../schema';
import { REPOSITORY_ANALYSIS_SYSTEM_PROMPT } from '../../prompts/system-prompt';
import { buildRepositoryAnalysisUserPrompt } from '../../prompts/repository-analysis-prompt';
import { parseRawAnalysisResponse } from '../../parsing/parse-analysis-response';
import { validateAnalysisPaths } from '../../parsing/validate-paths';
import { BackboardConfig, getBackboardConfig } from './backboard-config';
import {
  AiInvalidResponseError,
  AiModelUnavailableError,
  AiProviderError,
  AiRateLimitError,
  AiTimeoutError,
} from '../../errors';

export interface BackboardClientLike {
  sendMessage(options: {
    content?: string;
    system_prompt?: string;
    llm_provider?: string;
    model_name?: string;
    stream?: boolean;
    memory?: string;
    web_search?: string;
    json_output?: boolean;
    [key: string]: unknown;
  }): Promise<unknown>;
}

export class BackboardRepositoryAnalyzer implements RepositoryAnalyzer {
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

  async analyze(
    context: RepositoryContext,
    options?: RepositoryAnalysisOptions
  ): Promise<RepositoryAnalysis> {
    if (options?.signal?.aborted) {
      throw new AiTimeoutError('Analysis aborted by caller signal.');
    }

    const userPrompt = buildRepositoryAnalysisUserPrompt(context);

    let rawOutput: string;
    try {
      const response = await this.client.sendMessage({
        content: userPrompt,
        system_prompt: REPOSITORY_ANALYSIS_SYSTEM_PROMPT,
        llm_provider: this.config.modelProvider,
        model_name: this.config.modelName,
        stream: false,
        memory: 'off',
        web_search: 'off',
        json_output: true,
      });

      rawOutput = this.extractResponseText(response);
    } catch (err: unknown) {
      this.mapAndRethrowError(err);
    }

    if (options?.signal?.aborted) {
      throw new AiTimeoutError('Analysis aborted by caller signal.');
    }

    let rawAnalysis;
    try {
      rawAnalysis = parseRawAnalysisResponse(rawOutput);
    } catch (err) {
      // Perform at most one controlled repair attempt if output looks like JSON
      if (
        err instanceof AiInvalidResponseError &&
        rawOutput.includes('{') &&
        rawOutput.includes('}')
      ) {
        rawAnalysis = await this.attemptControlledRepair(rawOutput, err.message);
      } else {
        throw err;
      }
    }

    // Sanitize and validate repository paths against genuine context
    const sanitizedAnalysis = validateAnalysisPaths(rawAnalysis, context);

    const fullAnalysis: RepositoryAnalysis = {
      ...sanitizedAnalysis,
      analysisMetadata: {
        modelProvider: this.config.modelProvider,
        modelName: this.config.modelName,
        analyzedAt: new Date().toISOString(),
      },
    };

    // Final schema verification
    return RepositoryAnalysisSchema.parse(fullAnalysis);
  }

  private extractResponseText(response: unknown): string {
    if (!response || typeof response !== 'object') {
      if (typeof response === 'string') {
        return response;
      }
      throw new AiInvalidResponseError('Empty or invalid response received from AI provider.');
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
      'Could not extract text content from AI provider response.',
      JSON.stringify(response).slice(0, 100)
    );
  }

  private async attemptControlledRepair(
    invalidOutput: string,
    validationError: string
  ) {
    const repairPrompt = `Your previous JSON output failed validation with the following error:
${validationError}

Please repair the JSON to strictly conform to the required RepositoryAnalysis schema:
${invalidOutput.slice(0, 10_000)}

Output ONLY the repaired valid JSON object.`;

    try {
      const response = await this.client.sendMessage({
        content: repairPrompt,
        system_prompt: REPOSITORY_ANALYSIS_SYSTEM_PROMPT,
        llm_provider: this.config.modelProvider,
        model_name: this.config.modelName,
        stream: false,
        memory: 'off',
        web_search: 'off',
        json_output: true,
      });

      const repairedText = this.extractResponseText(response);
      return parseRawAnalysisResponse(repairedText);
    } catch (repairErr: unknown) {
      if (repairErr instanceof AiInvalidResponseError) {
        throw repairErr;
      }
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
