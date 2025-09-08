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
        // Pass through the raw API error message
        let errorMessage = errorData.error || `API request failed: ${response.status}`;
        
        // Extract the original API error message from details
        if (errorData.details) {
          try {
            const details = JSON.parse(errorData.details);
            if (details.error && details.error.message) {
              errorMessage = details.error.message;
            } else if (typeof errorData.details === 'string') {
              errorMessage = errorData.details;
            }
          } catch (e) {
            // If details isn't JSON, use it as a string
            if (typeof errorData.details === 'string') {
              errorMessage = errorData.details;
            }
          }
        }
        
        throw new Error(errorMessage);
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
      case 'extract_properties_batch':
        // Core prompt is always used - user instructions are only additional
        const basePrompt = `You are an expert at extracting configuration key/value pairs from arbitrary files.

TASK
Extract only meaningful configuration entries and return them as JSON ONLY.

OUTPUT
Return a JSON object with a single property "properties", which is an array of objects. Each object must contain:
- name: human-readable string (capitalize words, use spaces instead of dots, e.g., "Inverter Model" not "inverter.model")
- value: string or number (see typing rules)
- type: "text" | "number"

RULES
1) Ignore invoice headers, quote details, company info, addresses, dates, and other administrative metadata. Only return actual configuration items (hardware, software, or technical parameters).
2) Recognize keys in common formats: JSON, YAML, TOML, INI, .env, XML attributes/elements, shell/PowerShell assignments, and typical config-like code constants.
3) Ignore comments and disabled lines (e.g., starting with #, //, ;, /* ... */) and empty lines.
4) For duplicates, keep the last effective value in the file.
5) For nested structures, create a readable name by joining words with spaces (e.g., "Solar Panels Quantity").
6) Arrays -> join values with commas into a single string (type = "text").
7) Numbers: if the value is purely numeric (integer or float, optional leading sign), set type="number" and output value as a JSON number. Otherwise set type="text" and output the original textual value unmodified.
8) Booleans are "text".
9) If nothing is found, return {"properties": []}.
10) Do not include any commentary, code fences, or explanations—JSON only.`;

        const userInstructions = context?.customInstructions;
        const contextInfo = [
          context?.comparisonName ? `CONTEXT: This is for a comparison about: ${context.comparisonName}` : '',
          context?.contenderName ? `SOURCE: Document is from: ${context.contenderName}` : ''
        ].filter(Boolean).join('\n');

        return [
          basePrompt,
          userInstructions ? `\nADDITIONAL INSTRUCTIONS:\n${userInstructions}` : '',
          contextInfo ? `\n${contextInfo}` : '',
          `\nFILE CONTENT:\n${content}`
        ].filter(Boolean).join('');

      case 'generate_summary':
        return `Generate a concise summary of the following content for use in a comparison tool:

${content}

Return only the summary text, maximum 2-3 sentences.`;

      case 'suggest_values':
        return `Fill in the "value" field for each property based on the content. Return the complete JSON array with all properties:

${JSON.stringify(context?.existingProperties?.map(p => ({
  property: p.name,
  type: p.type,
  value: null,
  confidence: 0
})), null, 2)}

Rules:
- Fill "value" with extracted data or leave as null if not found
- Look for data in JSON-LD schema, structured data, product specifications, technical details, product descriptions, tables, lists, invoices, quotes, and embedded metadata
- Parse tabular data including item codes, descriptions, quantities, and prices from invoices or quotes
- Match property names to similar terms and synonyms in the content (e.g., "total kwh" might appear as "energy capacity", "battery energy", "kWh", "nominal energy", or in product descriptions like "5kwh Battery")
- For numeric types: use numbers only (e.g., 6 not "6kW") - extract numbers from text containing units (e.g., from "5.12kWh" extract 5.12, from "6000W" extract 6000, from "565w" extract 565)
- For text types: use descriptive text including model names, codes, and specifications (e.g., "Deye 6KW Hybrid Inverter")
- When analyzing invoices/quotes, look for relevant items in the product list and extract specifications from item descriptions
- Match quantities from tabular data when looking for component counts (solar panels, batteries, etc.)
- Extract pricing information from unit prices or line totals in tabular formats
- Set confidence 0.1-1.0 based on certainty - use 0.9-1.0 for structured data, 0.7-0.8 for product descriptions, 0.3-0.6 for inferred data
- Return ALL properties, even if value is null

Content:
${content}`;

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
        case 'extract_properties_batch':
        case 'suggest_values':
          // Try multiple JSON extraction strategies
          let parsed;
          
          // Strategy 1: JSON in code fences
          let jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[1].trim());
            } catch (e) {
              console.warn('Failed to parse JSON from code fences:', e);
            }
          }
          
          // Strategy 2: Plain JSON array anywhere in text
          if (!parsed) {
            jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              try {
                parsed = JSON.parse(jsonMatch[0]);
              } catch (e) {
                console.warn('Failed to parse JSON array:', e);
              }
            }
          }
          
          // Strategy 3: Extract JSON between any brackets, ignoring surrounding text
          if (!parsed) {
            const bracketMatch = responseText.match(/\[([\s\S]*?)\]/); 
            if (bracketMatch) {
              try {
                parsed = JSON.parse(`[${bracketMatch[1]}]`);
              } catch (e) {
                console.warn('Failed to parse bracketed content:', e);
              }
            }
          }
          
          if (parsed) {
            return {
              success: true,
              data: (type === 'extract_properties' || type === 'extract_properties_batch')
                ? { properties: parsed }
                : { suggestions: parsed }
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
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        
        // Pass through the raw OpenAI error message
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
        
        throw new Error(errorMessage);
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