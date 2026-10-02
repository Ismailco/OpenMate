export interface SpanOptions {
  name: string;
  op: string;
  attributes?: Record<string, string | number | boolean | undefined>;
}

export interface AiSpanOptions {
  name: string;
  op?: string;
  model: string;
  system?: string;
  operationType?: string;
  conversationId?: string;
  attributes?: Record<string, string | number | boolean | undefined>;
}

export interface AuthoritativeTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}
