export interface AIProviderConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface AIConfig {
  providers: AIProviderConfig[];
  activeProvider: 'anthropic' | 'openai' | 'none';
}

export interface AIAnalysisRequest {
  type: 'extract_properties' | 'generate_summary' | 'suggest_values' | 'analyze_attachment';
  content: string;
  context?: {
    existingProperties?: Array<{ name: string; type: string }>;
    comparisonName?: string;
    attachmentType?: string;
    contenderName?: string;
    customInstructions?: string;
  };
}

export interface AIAnalysisResponse {
  success: boolean;
  data?: {
    properties?: Array<{ name: string; type: 'text' | 'number' | 'rating' | 'datetime'; value?: string | number }>;
    summary?: string;
    suggestions?: Array<{ property: string; value: string | number; confidence: number }>;
    error?: string;
  };
  error?: string;
}

export interface AIService {
  analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  testConnection(): Promise<boolean>;
}