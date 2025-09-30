export interface AIProviderConfig {
  provider: 'anthropic' | 'openai' | 'ollama' | 'gemini';
  apiKey?: string; // Optional for ollama
  baseUrl?: string; // For ollama and custom endpoints
  model: string;
  enabled: boolean;
}

export interface AIConfig {
  providers: AIProviderConfig[];
  activeProvider: 'anthropic' | 'openai' | 'ollama' | 'gemini' | 'none';
}

export interface AIAnalysisRequest {
  type: 'extract_properties' | 'extract_properties_batch' | 'generate_summary' | 'suggest_values' | 'analyze_attachment';
  content: string;
  context?: {
    existingProperties?: Array<{ name: string; type: string }>;
    comparisonName?: string;
    attachmentType?: string;
    contenderName?: string;
    customInstructions?: string;
    fileCount?: number;
    fileNames?: string;
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