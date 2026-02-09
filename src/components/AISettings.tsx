'use client'

import { useState, useEffect, useMemo } from 'react';
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
  const [apiKeys, setApiKeys] = useState<Record<'anthropic' | 'openai' | 'gemini' | 'ollama', string>>({ anthropic: '', openai: '', gemini: '', ollama: '' });
  const [tempApiKeys, setTempApiKeys] = useState<Record<'anthropic' | 'openai' | 'gemini' | 'ollama', string>>({ anthropic: '', openai: '', gemini: '', ollama: '' });
  const [baseUrls, setBaseUrls] = useState<Record<'anthropic' | 'openai' | 'gemini' | 'ollama', string>>({ anthropic: '', openai: '', gemini: '', ollama: 'http://localhost:11434' });
  const [tempBaseUrls, setTempBaseUrls] = useState<Record<'anthropic' | 'openai' | 'gemini' | 'ollama', string>>({ anthropic: '', openai: '', gemini: '', ollama: 'http://localhost:11434' });
  const [tempDefaultModel, setTempDefaultModel] = useState<string>('');
  const [providerEnabled, setProviderEnabled] = useState<Record<'anthropic' | 'openai' | 'gemini' | 'ollama', boolean>>({ anthropic: false, openai: false, gemini: false, ollama: false });
  const [tempProviderEnabled, setTempProviderEnabled] = useState<Record<'anthropic' | 'openai' | 'gemini' | 'ollama', boolean>>({ anthropic: false, openai: false, gemini: false, ollama: false });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'idle' | 'success' | 'error'>>({});
  const [testError, setTestError] = useState<Record<string, string | null>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [ollamaModels, setOllamaModels] = useState<Array<{name: string; size: number; family: string}>>([]);
  const [isLoadingOllamaModels, setIsLoadingOllamaModels] = useState(false);

  useEffect(() => {
    const savedConfig = aiService.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      // Set current model and API keys from config
      if (savedConfig.activeProvider !== 'none') {
        const activeProviderConfig = savedConfig.providers.find(p => p.provider === savedConfig.activeProvider);
        if (activeProviderConfig) {
          setDefaultModel(activeProviderConfig.model);
          setTempDefaultModel(activeProviderConfig.model);
        }
      }
      // Load API keys, base URLs and enabled state from all providers
      savedConfig.providers.forEach(p => {
        if (p.apiKey) {
          setApiKeys(prev => ({ ...prev, [p.provider]: p.apiKey! }));
          setTempApiKeys(prev => ({ ...prev, [p.provider]: p.apiKey! }));
        }
        if (p.baseUrl) {
          setBaseUrls(prev => ({ ...prev, [p.provider]: p.baseUrl! }));
          setTempBaseUrls(prev => ({ ...prev, [p.provider]: p.baseUrl! }));
        }
        setProviderEnabled(prev => ({ ...prev, [p.provider]: p.enabled }));
        setTempProviderEnabled(prev => ({ ...prev, [p.provider]: p.enabled }));
      });
    }
  }, []);

  // Fetch Ollama models when component loads if baseUrl is already set
  useEffect(() => {
    if (tempBaseUrls.ollama && tempBaseUrls.ollama.trim() !== '') {
      fetchOllamaModels(tempBaseUrls.ollama);
      // Also ensure Ollama is enabled when we have a valid URL
      if (!tempProviderEnabled.ollama) {
        setTempProviderEnabled(prev => ({ ...prev, ollama: true }));
      }
    }
  }, [tempBaseUrls.ollama]);

  // Also fetch models on initial load if we have an Ollama provider configured
  useEffect(() => {
    const ollamaProvider = config.providers.find(p => p.provider === 'ollama');
    if (ollamaProvider && ollamaProvider.baseUrl && ollamaProvider.enabled) {
      fetchOllamaModels(ollamaProvider.baseUrl);
    }
  }, [config.providers]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getAllModels = useMemo(() => {
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
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Powerful)', provider: 'openai' as const },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Most Advanced, State-of-the-art)', provider: 'gemini' as const },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Best Price-Performance)', provider: 'gemini' as const },
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Ultra Fast, Cost-Efficient)', provider: 'gemini' as const }
    ];

    // Add dynamic Ollama models
    const ollamaModelOptions = ollamaModels.map(model => ({
      value: model.name,
      label: `${model.name} (${formatFileSize(model.size)}, Local)`,
      provider: 'ollama' as const
    }));

    const allModelsWithOllama = [...allModels, ...ollamaModelOptions];

    // Filter models based on available credentials AND enabled state (use temp values for immediate UI feedback)
    const availableModels = allModelsWithOllama.filter(model => {
      const isEnabled = tempProviderEnabled[model.provider];
      if (!isEnabled) return false;
      
      // For ollama, check baseUrl; for others, check apiKey
      if (model.provider === 'ollama') {
        return tempBaseUrls[model.provider] && tempBaseUrls[model.provider].trim() !== '';
      } else {
        return tempApiKeys[model.provider] && tempApiKeys[model.provider].trim() !== '';
      }
    });

    return [
      { value: '', label: 'Select an AI model...', provider: null },
      ...availableModels
    ];
  }, [ollamaModels, tempProviderEnabled, tempApiKeys, tempBaseUrls]);

  const handleTempDefaultModelChange = (model: string) => {
    setTempDefaultModel(model);
  };

  const handleTempApiKeyChange = (provider: 'anthropic' | 'openai' | 'gemini' | 'ollama', apiKey: string) => {
    const previousApiKey = tempApiKeys[provider];
    const hadNoPreviousKey = !previousApiKey || previousApiKey.trim() === '';
    const hasNewKey = apiKey && apiKey.trim() !== '';
    
    setTempApiKeys(prev => ({ ...prev, [provider]: apiKey }));
    
    // Auto-enable if there was no API key before and now there is one (but not for ollama)
    if (provider !== 'ollama' && hadNoPreviousKey && hasNewKey) {
      setTempProviderEnabled(prev => ({ ...prev, [provider]: true }));
    }
  };

  const handleTempBaseUrlChange = (provider: 'anthropic' | 'openai' | 'gemini' | 'ollama', baseUrl: string) => {
    const previousBaseUrl = tempBaseUrls[provider];
    const hadNoPreviousUrl = !previousBaseUrl || previousBaseUrl.trim() === '';
    const hasNewUrl = baseUrl && baseUrl.trim() !== '';
    
    setTempBaseUrls(prev => ({ ...prev, [provider]: baseUrl }));
    
    // Auto-enable if there was no base URL before and now there is one (for ollama)
    if (provider === 'ollama' && hadNoPreviousUrl && hasNewUrl) {
      setTempProviderEnabled(prev => ({ ...prev, [provider]: true }));
    }

    // Fetch available models when Ollama URL changes
    if (provider === 'ollama' && hasNewUrl) {
      fetchOllamaModels(baseUrl);
    }
  };

  const fetchOllamaModels = async (baseUrl: string) => {
    setIsLoadingOllamaModels(true);
    try {
      const response = await fetch('/api/ollama/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl })
      });
      
      if (response.ok) {
        const data = await response.json();
        setOllamaModels(data.models || []);
      } else {
        console.error('Failed to fetch Ollama models');
        setOllamaModels([]);
      }
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      setOllamaModels([]);
    } finally {
      setIsLoadingOllamaModels(false);
    }
  };

  const handleTempProviderEnabledChange = (provider: 'anthropic' | 'openai' | 'gemini' | 'ollama', enabled: boolean) => {
    setTempProviderEnabled(prev => ({ ...prev, [provider]: enabled }));
  };

  const saveApiKey = (provider: 'anthropic' | 'openai' | 'gemini' | 'ollama', apiKey: string) => {
    // Update local state
    setApiKeys(prev => ({ ...prev, [provider]: apiKey }));
    
    // Save to service - use the current enabled state, don't base it on API key presence
    const isEnabled = tempProviderEnabled[provider];
    const existingConfig = config.providers.find(p => p.provider === provider);
    const providerConfig: AIProviderConfig = {
      provider,
      apiKey: provider === 'ollama' ? undefined : apiKey,
      baseUrl: existingConfig?.baseUrl || tempBaseUrls[provider],
      model: provider === 'anthropic' ? 'claude-sonnet-4-20250514' : provider === 'openai' ? 'gpt-4.1-mini' : provider === 'gemini' ? 'gemini-2.5-flash' : 'qwen3:8b',
      enabled: isEnabled
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

  const saveBaseUrl = (provider: 'anthropic' | 'openai' | 'gemini' | 'ollama', baseUrl: string) => {
    // Update local state
    setBaseUrls(prev => ({ ...prev, [provider]: baseUrl }));
    
    // Save to service - use the current enabled state
    const isEnabled = tempProviderEnabled[provider];
    const existingConfig = config.providers.find(p => p.provider === provider);
    const providerConfig: AIProviderConfig = {
      provider,
      apiKey: existingConfig?.apiKey || tempApiKeys[provider],
      baseUrl,
      model: existingConfig?.model || (provider === 'anthropic' ? 'claude-sonnet-4-20250514' : provider === 'openai' ? 'gpt-4.1-mini' : provider === 'gemini' ? 'gemini-2.5-flash' : 'qwen3:8b'),
      enabled: isEnabled
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

  const saveProviderEnabled = (provider: 'anthropic' | 'openai' | 'gemini' | 'ollama', enabled: boolean) => {
    // Update local state
    setProviderEnabled(prev => ({ ...prev, [provider]: enabled }));
    
    // Get existing provider config or create new one
    const existingConfig = config.providers.find(p => p.provider === provider);
    const providerConfig: AIProviderConfig = {
      provider,
      apiKey: provider === 'ollama' ? undefined : (existingConfig?.apiKey || tempApiKeys[provider] || ''),
      baseUrl: existingConfig?.baseUrl || tempBaseUrls[provider],
      model: existingConfig?.model || (provider === 'anthropic' ? 'claude-sonnet-4-20250514' : provider === 'openai' ? 'gpt-4.1-mini' : provider === 'gemini' ? 'gemini-2.5-flash' : 'qwen3:8b'),
      enabled
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

  const saveAllChanges = () => {
    setIsSaving(true);
    
    // Save API keys
    Object.entries(tempApiKeys).forEach(([provider, apiKey]) => {
      if (apiKeys[provider as 'anthropic' | 'openai' | 'ollama'] !== apiKey) {
        saveApiKey(provider as 'anthropic' | 'openai' | 'ollama', apiKey);
      }
    });

    // Save base URLs
    Object.entries(tempBaseUrls).forEach(([provider, baseUrl]) => {
      if (baseUrls[provider as 'anthropic' | 'openai' | 'ollama'] !== baseUrl) {
        saveBaseUrl(provider as 'anthropic' | 'openai' | 'ollama', baseUrl);
      }
    });

    // Save provider enabled states
    Object.entries(tempProviderEnabled).forEach(([provider, enabled]) => {
      if (providerEnabled[provider as 'anthropic' | 'openai' | 'ollama'] !== enabled) {
        saveProviderEnabled(provider as 'anthropic' | 'openai' | 'ollama', enabled);
      }
    });

    // Save model and provider
    if (tempDefaultModel !== defaultModel) {
      setDefaultModel(tempDefaultModel);
      saveModelAndProvider(tempDefaultModel);
    }

    // Show success feedback
    setIsSaving(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const saveModelAndProvider = (model: string) => {
    // Get the selected model's provider
    let activeProvider: 'anthropic' | 'openai' | 'gemini' | 'ollama' | 'none' = 'none';
    if (model) {
      const modelInfo = getAllModels.find(m => m.value === model);
      if (modelInfo && modelInfo.provider) {
        activeProvider = modelInfo.provider;
      }
    }
    
    // Set the active provider and model - check credentials and enabled state
    let hasValidCredentials = false;
    if (activeProvider === 'ollama') {
      hasValidCredentials = tempBaseUrls[activeProvider]?.trim() !== '';
    } else if (activeProvider === 'anthropic' || activeProvider === 'openai' || activeProvider === 'gemini') {
      hasValidCredentials = apiKeys[activeProvider]?.trim() !== '';
    }
    
    if (model && activeProvider !== 'none' && hasValidCredentials && tempProviderEnabled[activeProvider]) {
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

  const getCurrentProvider = (): 'anthropic' | 'openai' | 'gemini' | 'ollama' | null => {
    if (!tempDefaultModel) return null;
    const modelInfo = getAllModels.find(m => m.value === tempDefaultModel);
    return modelInfo?.provider || null;
  };

  const getCurrentApiKey = (): string => {
    const provider = getCurrentProvider();
    if (!provider) return '';
    
    // For ollama, return baseUrl; for others, return apiKey
    if (provider === 'ollama') {
      return tempBaseUrls[provider] || '';
    } else {
      return tempApiKeys[provider] || '';
    }
  };

  const testApiKey = async (provider: 'anthropic' | 'openai' | 'gemini' | 'ollama') => {
    setIsTestingConnection(provider);
    setConnectionStatus(prev => ({ ...prev, [provider]: 'idle' }));
    setTestError(prev => ({ ...prev, [provider]: null }));

    try {
      // Check credentials based on provider type
      if (provider === 'ollama') {
        const baseUrl = tempBaseUrls[provider];
        if (!baseUrl) {
          setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
          setTestError(prev => ({ ...prev, [provider]: 'Base URL required' }));
          return;
        }
      } else {
        const apiKey = tempApiKeys[provider];
        if (!apiKey) {
          setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
          setTestError(prev => ({ ...prev, [provider]: 'API key required' }));
          return;
        }
      }

      if (provider === 'anthropic') {
        const response = await fetch('/api/test-claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: tempApiKeys[provider] })
        });
        const result = await response.json();
        
        if (result.success) {
          setConnectionStatus(prev => ({ ...prev, [provider]: 'success' }));
        } else {
          setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
          setTestError(prev => ({ ...prev, [provider]: JSON.stringify(result, null, 2) }));
        }
      } else if (provider === 'ollama') {
        // For Ollama, we need to test with a direct API call since we might not have a model configured yet
        const testModel = ollamaModels.length > 0 ? ollamaModels[0].name : 'qwen3:8b'; // Use first available model or fallback
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'ollama',
            baseUrl: tempBaseUrls[provider],
            model: testModel,
            prompt: 'Test',
            maxTokens: 5
          })
        });
        
        if (response.ok) {
          setConnectionStatus(prev => ({ ...prev, [provider]: 'success' }));
        } else {
          const errorData = await response.json().catch(() => ({}));
          let errorMessage = 'Connection test failed';
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.details) {
            errorMessage = errorData.details;
          }
          setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
          setTestError(prev => ({ ...prev, [provider]: errorMessage }));
        }
      } else if (provider === 'gemini') {
        // Test Gemini directly using the provided temp key without requiring save
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'gemini',
            apiKey: tempApiKeys.gemini,
            model: 'gemini-2.5-flash',
            prompt: 'Test',
            maxTokens: 5
          })
        });

        if (response.ok) {
          setConnectionStatus(prev => ({ ...prev, [provider]: 'success' }));
        } else {
          const errorData = await response.json().catch(() => ({}));
          let errorMessage = 'Connection test failed';
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.details) {
            errorMessage = errorData.details;
          }
          setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
          setTestError(prev => ({ ...prev, [provider]: errorMessage }));
        }
      } else {
        // OpenAI: test via service which uses saved config
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

  const getApiKeyPlaceholder = (provider: 'anthropic' | 'openai' | 'gemini') => {
    switch (provider) {
      case 'anthropic':
        return 'sk-ant-api03-...';
      case 'openai':
        return 'sk-...';
      case 'gemini':
        return 'AIzaSy...';
      default:
        return '';
    }
  };

  const getApiKeyHelpText = (provider: 'anthropic' | 'openai' | 'gemini') => {
    switch (provider) {
      case 'anthropic':
        return 'Get your API key from https://console.anthropic.com/';
      case 'openai':
        return 'Get your API key from https://platform.openai.com/api-keys';
      case 'gemini':
        return 'Get your API key from https://aistudio.google.com/app/apikey';
      default:
        return '';
    }
  };

  const toggleShowApiKey = (provider: string) => {
    setShowApiKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const currentProvider = getCurrentProvider();
  const currentApiKey = getCurrentApiKey();
  const testKey = currentProvider ? `${currentProvider}-${tempDefaultModel}` : '';
  const canTest = tempDefaultModel && currentApiKey && currentProvider;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-100">AI Integration</h2>
        <div className="flex gap-2">
          <button
            onClick={saveAllChanges}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-blue-500 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        Configure your AI providers to enable automatic property extraction, content analysis, and summarization features.
      </p>
      
      {/* Inline Save Feedback */}
      {showSavedToast && (
        <div className="mb-4 bg-green-900/20 border border-green-800 rounded-md p-3">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <span className="w-4 h-4">✓</span>
            Settings saved successfully
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* API Keys */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">API Keys</h3>
          
          {/* Anthropic API Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Anthropic (Claude) API Key
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={tempProviderEnabled.anthropic}
                  onChange={(e) => handleTempProviderEnabledChange('anthropic', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded-sm focus:ring-blue-500 focus:ring-2"
                />
                <span>Enabled</span>
              </label>
            </div>
            <div className="relative">
              <input
                type={showApiKeys['anthropic'] ? "text" : "password"}
                value={tempApiKeys.anthropic}
                onChange={(e) => handleTempApiKeyChange('anthropic', e.target.value)}
                placeholder={getApiKeyPlaceholder('anthropic')}
                className="w-full px-3 py-2 pr-20 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
              <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded-sm text-red-400 text-xs">
                <p className="font-semibold mb-1">Connection Failed:</p>
                <pre className="whitespace-pre-wrap">{testError['anthropic']}</pre>
              </div>
            )}
          </div>

          {/* OpenAI API Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                OpenAI (GPT) API Key
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={tempProviderEnabled.openai}
                  onChange={(e) => handleTempProviderEnabledChange('openai', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded-sm focus:ring-blue-500 focus:ring-2"
                />
                <span>Enabled</span>
              </label>
            </div>
            <div className="relative">
              <input
                type={showApiKeys['openai'] ? "text" : "password"}
                value={tempApiKeys.openai}
                onChange={(e) => handleTempApiKeyChange('openai', e.target.value)}
                placeholder={getApiKeyPlaceholder('openai')}
                className="w-full px-3 py-2 pr-20 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
              <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded-sm text-red-400 text-xs">
                <p className="font-semibold mb-1">Connection Failed:</p>
                <pre className="whitespace-pre-wrap">{testError['openai']}</pre>
              </div>
            )}
          </div>

          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Google Gemini API Key
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={tempProviderEnabled.gemini}
                  onChange={(e) => handleTempProviderEnabledChange('gemini', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded-sm focus:ring-blue-500 focus:ring-2"
                />
                <span>Enabled</span>
              </label>
            </div>
            <div className="relative">
              <input
                type={showApiKeys['gemini'] ? "text" : "password"}
                value={tempApiKeys.gemini}
                onChange={(e) => handleTempApiKeyChange('gemini', e.target.value)}
                placeholder={getApiKeyPlaceholder('gemini')}
                className="w-full px-3 py-2 pr-20 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => toggleShowApiKey('gemini')}
                className="absolute inset-y-0 right-0 px-3 py-2 text-sm text-gray-400 hover:text-gray-200"
              >
                {showApiKeys['gemini'] ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-blue-600">
                <a 
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {getApiKeyHelpText('gemini')}
                </a>
              </p>
              {tempApiKeys.gemini && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testApiKey('gemini')}
                    disabled={isTestingConnection === 'gemini'}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-gray-100 rounded-md transition-colors"
                  >
                    {isTestingConnection === 'gemini' ? 'Testing...' : 'Test'}
                  </button>
                  {connectionStatus['gemini'] === 'success' && (
                    <span className="text-green-400 text-sm">✓ Connected</span>
                  )}
                </div>
              )}
            </div>
            {connectionStatus['gemini'] === 'error' && testError['gemini'] && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded-sm text-red-400 text-xs">
                <p className="font-semibold mb-1">Connection Failed:</p>
                <pre className="whitespace-pre-wrap">{testError['gemini']}</pre>
              </div>
            )}
          </div>

          {/* Ollama Configuration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Ollama (Local AI)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={tempProviderEnabled.ollama}
                  onChange={(e) => handleTempProviderEnabledChange('ollama', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded-sm focus:ring-blue-500 focus:ring-2"
                />
                <span>Enabled</span>
              </label>
            </div>
            <div>
              <input
                type="text"
                value={tempBaseUrls.ollama}
                onChange={(e) => handleTempBaseUrlChange('ollama', e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-xs text-gray-400">
                  Enter the base URL where Ollama is running (default: http://localhost:11434)
                </p>
                {isLoadingOllamaModels && (
                  <p className="text-xs text-blue-400 mt-1">
                    Loading available models...
                  </p>
                )}
                {ollamaModels.length > 0 && !isLoadingOllamaModels && (
                  <p className="text-xs text-green-400 mt-1">
                    Found {ollamaModels.length} model{ollamaModels.length === 1 ? '' : 's'}: {ollamaModels.map(m => m.name).join(', ')}
                  </p>
                )}
              </div>
              {tempBaseUrls.ollama && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchOllamaModels(tempBaseUrls.ollama)}
                    disabled={isLoadingOllamaModels}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-blue-700 disabled:text-gray-500 text-gray-100 rounded-md transition-colors"
                  >
                    {isLoadingOllamaModels ? 'Loading...' : 'Refresh Models'}
                  </button>
                  <button
                    onClick={() => testApiKey('ollama')}
                    disabled={isTestingConnection === 'ollama'}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-gray-100 rounded-md transition-colors"
                  >
                    {isTestingConnection === 'ollama' ? 'Testing...' : 'Test'}
                  </button>
                  {connectionStatus['ollama'] === 'success' && (
                    <span className="text-green-400 text-sm">✓ Connected</span>
                  )}
                </div>
              )}
            </div>
            {connectionStatus['ollama'] === 'error' && testError['ollama'] && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded-sm text-red-400 text-xs">
                <p className="font-semibold mb-1">Connection Failed:</p>
                <pre className="whitespace-pre-wrap">{testError['ollama']}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Default Model Selection - After API Keys */}
        {(tempApiKeys.anthropic.trim() !== '' || tempApiKeys.openai.trim() !== '' || tempApiKeys.gemini.trim() !== '' || tempBaseUrls.ollama.trim() !== '') && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default AI Model
            </label>
            <select
              value={tempDefaultModel}
              onChange={(e) => handleTempDefaultModelChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {getAllModels.map(option => (
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
        {tempDefaultModel && currentApiKey && currentProvider && tempProviderEnabled[currentProvider] && (
          <div className="bg-green-900/20 border border-green-800 rounded-md p-4">
            <h3 className="text-sm font-medium text-green-300 mb-2">
              AI Features Available (using {getAllModels.find(m => m.value === tempDefaultModel)?.label}):
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
