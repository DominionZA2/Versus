'use client'

import { useState, useEffect } from 'react';
import { AIConfig, AIProviderConfig } from '@/types/ai';
import { aiService } from '@/lib/ai-service';

interface AISettingsProps {
  onClose?: () => void;
}

export default function AISettings({ onClose }: AISettingsProps) {
  const [config, setConfig] = useState<AIConfig>({
    providers: [],
    activeProvider: 'none'
  });
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<Record<'anthropic' | 'openai', string>>({ anthropic: '', openai: '' });
  const [tempApiKeys, setTempApiKeys] = useState<Record<'anthropic' | 'openai', string>>({ anthropic: '', openai: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'idle' | 'success' | 'error'>>({});
  const [testError, setTestError] = useState<Record<string, string | null>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedConfig = aiService.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      // Set current model and API keys from config
      if (savedConfig.activeProvider !== 'none') {
        const activeProviderConfig = savedConfig.providers.find(p => p.provider === savedConfig.activeProvider);
        if (activeProviderConfig) {
          setDefaultModel(activeProviderConfig.model);
        }
      }
      // Load API keys from all providers
      savedConfig.providers.forEach(p => {
        setApiKeys(prev => ({ ...prev, [p.provider]: p.apiKey }));
        setTempApiKeys(prev => ({ ...prev, [p.provider]: p.apiKey }));
      });
    }
  }, []);

  const getAllModels = () => {
    const allModels = [
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Latest, Recommended)', provider: 'anthropic' as const },
      { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (Hybrid Reasoning)', provider: 'anthropic' as const },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Balanced)', provider: 'anthropic' as const },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fast, Cheap)', provider: 'anthropic' as const },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fastest)', provider: 'anthropic' as const },
      { value: 'gpt-4.1', label: 'GPT-4.1 (Most Powerful, Latest)', provider: 'openai' as const },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (Fast, Cheap, Latest)', provider: 'openai' as const },
      { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano (Fastest, Cheapest)', provider: 'openai' as const },
      { value: 'o3', label: 'O3 (Advanced Reasoning)', provider: 'openai' as const },
      { value: 'o3-mini', label: 'O3 Mini (Fast Reasoning)', provider: 'openai' as const },
      { value: 'o4-mini', label: 'O4 Mini (Math/Coding Specialist)', provider: 'openai' as const },
      { value: 'gpt-4o', label: 'GPT-4o (Multimodal)', provider: 'openai' as const },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Powerful)', provider: 'openai' as const }
    ];

    // Filter models based on available API keys
    const availableModels = allModels.filter(model => {
      const hasApiKey = apiKeys[model.provider] && apiKeys[model.provider].trim() !== '';
      return hasApiKey;
    });

    return [
      { value: '', label: 'Select an AI model...', provider: null },
      ...availableModels
    ];
  };

  const handleDefaultModelChange = (model: string) => {
    setDefaultModel(model);
    // Auto-save after a short delay
    setTimeout(() => {
      saveModelAndProvider(model);
    }, 100);
  };

  const handleTempApiKeyChange = (provider: 'anthropic' | 'openai', apiKey: string) => {
    setTempApiKeys(prev => ({ ...prev, [provider]: apiKey }));
    // Auto-save API key after a delay
    setTimeout(() => {
      saveApiKey(provider, apiKey);
    }, 500);
  };

  const saveApiKey = (provider: 'anthropic' | 'openai', apiKey: string) => {
    // Update local state
    setApiKeys(prev => ({ ...prev, [provider]: apiKey }));
    
    // Save to service
    const providerConfig: AIProviderConfig = {
      provider,
      apiKey,
      model: provider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4.1-mini',
      enabled: apiKey.trim() !== ''
    };
    
    aiService.updateProvider(providerConfig);
    
    // Update local config
    const newConfig = { ...config };
    const existingIndex = newConfig.providers.findIndex(p => p.provider === provider);
    if (existingIndex >= 0) {
      newConfig.providers[existingIndex] = providerConfig;
    } else {
      newConfig.providers.push(providerConfig);
    }
    setConfig(newConfig);
  };

  const saveModelAndProvider = (model: string) => {
    // Get the selected model's provider
    let activeProvider: 'anthropic' | 'openai' | 'none' = 'none';
    if (model) {
      const modelInfo = getAllModels().find(m => m.value === model);
      if (modelInfo && modelInfo.provider) {
        activeProvider = modelInfo.provider;
      }
    }
    
    // Set the active provider and model
    if (model && activeProvider !== 'none' && apiKeys[activeProvider]?.trim()) {
      aiService.setActiveProvider(activeProvider);
      const newConfig = { ...config };
      newConfig.activeProvider = activeProvider;
      
      // Update the provider's model
      const existingIndex = newConfig.providers.findIndex(p => p.provider === activeProvider);
      if (existingIndex >= 0) {
        newConfig.providers[existingIndex].model = model;
        aiService.updateProvider(newConfig.providers[existingIndex]);
      }
      
      setConfig(newConfig);
    }
  };

  const getCurrentProvider = (): 'anthropic' | 'openai' | null => {
    if (!defaultModel) return null;
    const modelInfo = getAllModels().find(m => m.value === defaultModel);
    return modelInfo?.provider || null;
  };

  const getCurrentApiKey = (): string => {
    const provider = getCurrentProvider();
    return provider ? apiKeys[provider] : '';
  };

  const testApiKey = async (provider: 'anthropic' | 'openai') => {
    setIsTestingConnection(provider);
    setConnectionStatus(prev => ({ ...prev, [provider]: 'idle' }));
    setTestError(prev => ({ ...prev, [provider]: null }));

    try {
      const apiKey = apiKeys[provider];
      if (!apiKey) {
        setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
        setTestError(prev => ({ ...prev, [provider]: 'API key required' }));
        return;
      }

      if (provider === 'anthropic') {
        const response = await fetch('/api/test-claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey })
        });
        const result = await response.json();
        
        if (result.success) {
          setConnectionStatus(prev => ({ ...prev, [provider]: 'success' }));
        } else {
          setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
          setTestError(prev => ({ ...prev, [provider]: JSON.stringify(result, null, 2) }));
        }
      } else {
        const result = await aiService.testConnection(provider);
        setConnectionStatus(prev => ({ ...prev, [provider]: result ? 'success' : 'error' }));
        if (!result) {
          setTestError(prev => ({ ...prev, [provider]: 'Connection test failed' }));
        }
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
      setTestError(prev => ({ ...prev, [provider]: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` }));
    } finally {
      setIsTestingConnection(null);
    }
  };

  const getApiKeyPlaceholder = (provider: 'anthropic' | 'openai') => {
    switch (provider) {
      case 'anthropic':
        return 'sk-ant-api03-...';
      case 'openai':
        return 'sk-...';
      default:
        return '';
    }
  };

  const getApiKeyHelpText = (provider: 'anthropic' | 'openai') => {
    switch (provider) {
      case 'anthropic':
        return 'Get your API key from https://console.anthropic.com/';
      case 'openai':
        return 'Get your API key from https://platform.openai.com/api-keys';
      default:
        return '';
    }
  };

  const toggleShowApiKey = (provider: string) => {
    setShowApiKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const currentProvider = getCurrentProvider();
  const currentApiKey = getCurrentApiKey();
  const testKey = currentProvider ? `${currentProvider}-${defaultModel}` : '';
  const canTest = defaultModel && currentApiKey && currentProvider;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-100">AI Integration</h2>
        <div className="flex gap-2">
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-6">
        Configure your AI providers to enable automatic property extraction, content analysis, and summarization features.
      </p>

      <div className="space-y-6">
        {/* API Keys */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">API Keys</h3>
          
          {/* Anthropic API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Anthropic (Claude) API Key
            </label>
            <div className="relative">
              <input
                type={showApiKeys['anthropic'] ? "text" : "password"}
                value={tempApiKeys.anthropic}
                onChange={(e) => handleTempApiKeyChange('anthropic', e.target.value)}
                placeholder={getApiKeyPlaceholder('anthropic')}
                className="w-full px-3 py-2 pr-20 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => toggleShowApiKey('anthropic')}
                className="absolute inset-y-0 right-0 px-3 py-2 text-sm text-gray-400 hover:text-gray-200"
              >
                {showApiKeys['anthropic'] ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-blue-600">
                <a 
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {getApiKeyHelpText('anthropic')}
                </a>
              </p>
              {tempApiKeys.anthropic && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testApiKey('anthropic')}
                    disabled={isTestingConnection === 'anthropic'}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-gray-100 rounded-md transition-colors"
                  >
                    {isTestingConnection === 'anthropic' ? 'Testing...' : 'Test'}
                  </button>
                  {connectionStatus['anthropic'] === 'success' && (
                    <span className="text-green-400 text-sm">✓ Connected</span>
                  )}
                </div>
              )}
            </div>
            {connectionStatus['anthropic'] === 'error' && testError['anthropic'] && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-red-400 text-xs">
                <p className="font-semibold mb-1">Connection Failed:</p>
                <pre className="whitespace-pre-wrap">{testError['anthropic']}</pre>
              </div>
            )}
          </div>

          {/* OpenAI API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              OpenAI (GPT) API Key
            </label>
            <div className="relative">
              <input
                type={showApiKeys['openai'] ? "text" : "password"}
                value={tempApiKeys.openai}
                onChange={(e) => handleTempApiKeyChange('openai', e.target.value)}
                placeholder={getApiKeyPlaceholder('openai')}
                className="w-full px-3 py-2 pr-20 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => toggleShowApiKey('openai')}
                className="absolute inset-y-0 right-0 px-3 py-2 text-sm text-gray-400 hover:text-gray-200"
              >
                {showApiKeys['openai'] ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-blue-600">
                <a 
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {getApiKeyHelpText('openai')}
                </a>
              </p>
              {tempApiKeys.openai && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testApiKey('openai')}
                    disabled={isTestingConnection === 'openai'}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-gray-100 rounded-md transition-colors"
                  >
                    {isTestingConnection === 'openai' ? 'Testing...' : 'Test'}
                  </button>
                  {connectionStatus['openai'] === 'success' && (
                    <span className="text-green-400 text-sm">✓ Connected</span>
                  )}
                </div>
              )}
            </div>
            {connectionStatus['openai'] === 'error' && testError['openai'] && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-red-400 text-xs">
                <p className="font-semibold mb-1">Connection Failed:</p>
                <pre className="whitespace-pre-wrap">{testError['openai']}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Default Model Selection - After API Keys */}
        {(apiKeys.anthropic.trim() !== '' || apiKeys.openai.trim() !== '') && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default AI Model
            </label>
            <select
              value={defaultModel}
              onChange={(e) => handleDefaultModelChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getAllModels().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Select the default AI model to use for analysis features
            </p>
          </div>
        )}

        {/* AI Features Preview */}
        {defaultModel && currentApiKey && (
          <div className="bg-green-900/20 border border-green-800 rounded-md p-4">
            <h3 className="text-sm font-medium text-green-300 mb-2">
              AI Features Available (using {getAllModels().find(m => m.value === defaultModel)?.label}):
            </h3>
            <ul className="text-sm text-green-400 space-y-1">
              <li>• Extract properties from contender descriptions and attachments</li>
              <li>• Generate summaries from long text content</li>
              <li>• Suggest property values based on content analysis</li>
              <li>• Analyze uploaded files (PDFs, documents) for relevant information</li>
            </ul>
          </div>
        )}


        <p className="text-xs text-gray-400">
          Your API keys are stored locally in your browser and never sent to our servers.
        </p>
      </div>
    </div>
  );
}