import { AIConfig, AIProviderConfig, AIAnalysisRequest, AIAnalysisResponse, AIService } from '@/types/ai';

class AnthropicService implements AIService {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.config.enabled || !this.config.apiKey) {
      return { success: false, error: 'AI service not configured' };
    }

    try {
      const prompt = this.buildPrompt(request);
      
      console.log('=== BUILT PROMPT ===');
      console.log(prompt);
      console.log('=== END PROMPT ===');
      
      // Check if the content is a file (data URL)
      const isFile = request.content.startsWith('data:');
      
      const requestBody = isFile ? {
        provider: 'anthropic',
        apiKey: this.config.apiKey,
        model: this.config.model,
        prompt,
        maxTokens: 2000,
        file: request.content  // Send file data separately
      } : {
        provider: 'anthropic',
        apiKey: this.config.apiKey,
        model: this.config.model,
        prompt,
        maxTokens: 1000
      };

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('=== RAW AI RESPONSE ===');
      console.log(data);
      console.log('=== AI MESSAGE CONTENT ===');
      console.log(data.content[0].text);
      console.log('=== END AI RESPONSE ===');
      
      return this.parseResponse(data.content[0].text, request.type);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'anthropic',
          apiKey: this.config.apiKey,
          model: this.config.model,
          prompt: 'Test connection',
          maxTokens: 10
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private buildPrompt(request: AIAnalysisRequest): string {
    const { type, content, context } = request;

    switch (type) {
      case 'extract_properties':
        const customInstructions = context?.customInstructions || 'Look for key-value pairs, specifications, tables, or lists that could be comparison properties.';
        return `Analyze the following document content and extract ALL properties and values you can find based on the parsing instructions.

${context?.comparisonName ? `This is for a comparison about: ${context.comparisonName}` : ''}
${context?.contenderName ? `Document is from: ${context.contenderName}` : ''}

Parsing Instructions:
${customInstructions}

Document Content:
${content}

CRITICAL: Return ONLY valid JSON with ALL properties found in the document. Do not return existing properties - only what you extract from THIS document content:
[{"name": "Property Name", "type": "text|number|rating|datetime", "value": "extracted value"}]

Type guidelines:
- "number" for prices, quantities, measurements  
- "text" for descriptions, names, categories
- "rating" for scores, ratings 
- "datetime" for dates, times`;

      case 'generate_summary':
        return `Generate a concise summary of the following content for use in a comparison tool:

${content}

Return only the summary text, maximum 2-3 sentences.`;

      case 'suggest_values':
        return `Based on the following content, suggest values for these comparison properties. Return a JSON array with property, value, and confidence (0-1).

Properties: ${context?.existingProperties?.map(p => `${p.name} (${p.type})`).join(', ')}

Content:
${content}

Return only valid JSON in this format:
[{"property": "Property Name", "value": "suggested value", "confidence": 0.8}]`;

      case 'analyze_attachment':
        return `Analyze this ${context?.attachmentType || 'file'} content and extract key information that might be useful for comparison purposes:

${content}

Provide a structured analysis with key points that could be used as comparison properties or values.`;

      default:
        return content;
    }
  }

  private parseResponse(responseText: string, type: string): AIAnalysisResponse {
    try {
      switch (type) {
        case 'extract_properties':
        case 'suggest_values':
          // Try to extract JSON from response
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return { 
              success: true, 
              data: type === 'extract_properties' ? { properties: parsed } : { suggestions: parsed }
            };
          }
          break;
        
        case 'generate_summary':
        case 'analyze_attachment':
          return { 
            success: true, 
            data: { summary: responseText.trim() }
          };
      }

      return { success: false, error: 'Could not parse AI response' };
    } catch (error) {
      return { success: false, error: 'Failed to parse AI response' };
    }
  }
}

class OpenAIService implements AIService {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.config.enabled || !this.config.apiKey) {
      return { success: false, error: 'AI service not configured' };
    }

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseResponse(data.choices[0].message.content, request.type);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private buildPrompt(request: AIAnalysisRequest): string {
    // Same prompt building logic as Anthropic
    const anthropicService = new AnthropicService(this.config);
    return (anthropicService as any).buildPrompt(request);
  }

  private parseResponse(responseText: string, type: string): AIAnalysisResponse {
    // Same parsing logic as Anthropic
    const anthropicService = new AnthropicService(this.config);
    return (anthropicService as any).parseResponse(responseText, type);
  }
}

export class AIServiceManager {
  private config: AIConfig | null = null;
  private activeService: AIService | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('versus_ai_config');
      if (saved) {
        try {
          this.config = JSON.parse(saved);
          this.initializeActiveService();
        } catch (error) {
          console.error('Failed to load AI config:', error);
          this.initializeDefaultConfig();
        }
      } else {
        this.initializeDefaultConfig();
      }
    }
  }

  private initializeDefaultConfig(): void {
    this.config = {
      providers: [],
      activeProvider: 'none'
    };
    this.saveConfig();
  }

  private saveConfig(): void {
    if (typeof window !== 'undefined' && this.config) {
      localStorage.setItem('versus_ai_config', JSON.stringify(this.config));
    }
  }

  private initializeActiveService(): void {
    if (!this.config || this.config.activeProvider === 'none') {
      this.activeService = null;
      return;
    }

    const activeProviderConfig = this.config.providers.find(p => p.provider === this.config!.activeProvider);
    if (!activeProviderConfig || !activeProviderConfig.enabled || !activeProviderConfig.apiKey) {
      this.activeService = null;
      return;
    }

    switch (activeProviderConfig.provider) {
      case 'anthropic':
        this.activeService = new AnthropicService(activeProviderConfig);
        break;
      case 'openai':
        this.activeService = new OpenAIService(activeProviderConfig);
        break;
      default:
        this.activeService = null;
    }
  }

  public updateConfig(config: AIConfig): void {
    this.config = config;
    this.initializeActiveService();
    this.saveConfig();
  }

  public getConfig(): AIConfig | null {
    return this.config;
  }

  public updateProvider(providerConfig: AIProviderConfig): void {
    if (!this.config) return;

    const existingIndex = this.config.providers.findIndex(p => p.provider === providerConfig.provider);
    if (existingIndex >= 0) {
      this.config.providers[existingIndex] = providerConfig;
    } else {
      this.config.providers.push(providerConfig);
    }

    this.initializeActiveService();
    this.saveConfig();
  }

  public setActiveProvider(provider: 'anthropic' | 'openai' | 'none'): void {
    if (!this.config) return;

    this.config.activeProvider = provider;
    this.initializeActiveService();
    this.saveConfig();
  }


  public getProviderConfig(provider: 'anthropic' | 'openai'): AIProviderConfig | null {
    if (!this.config) return null;
    return this.config.providers.find(p => p.provider === provider) || null;
  }

  public isEnabled(): boolean {
    return this.activeService !== null;
  }

  public getActiveProvider(): string {
    return this.config?.activeProvider || 'none';
  }

  public async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.activeService) {
      return { success: false, error: 'AI service not configured' };
    }

    return this.activeService.analyze(request);
  }

  public async testConnection(provider?: 'anthropic' | 'openai'): Promise<boolean> {
    if (provider) {
      const providerConfig = this.getProviderConfig(provider);
      if (!providerConfig) return false;

      let service: AIService;
      switch (provider) {
        case 'anthropic':
          service = new AnthropicService(providerConfig);
          break;
        case 'openai':
          service = new OpenAIService(providerConfig);
          break;
        default:
          return false;
      }
      return service.testConnection();
    }

    if (!this.activeService) {
      return false;
    }

    return this.activeService.testConnection();
  }
}

// Global instance
export const aiService = new AIServiceManager();