'use client'

import { useState, useRef } from 'react';
import { Comparison, Contender, ComparisonProperty, AttachedFile } from '@/types';
import { storage } from '@/lib/storage';
import { aiService } from '@/lib/ai-service';
import AIConfigPrompt from './AIConfigPrompt';

interface ContenderFormData {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  hyperlinks: string[];
  properties: Record<string, string | number>;
  attachments: AttachedFile[];
}

interface ContenderFormProps {
  comparison: Comparison;
  mode: 'add' | 'edit';
  existingContender?: Contender;
  onSubmit: (contender: Contender) => void;
  onCancel: () => void;
}

export default function ContenderForm({ comparison, mode, existingContender, onSubmit, onCancel }: ContenderFormProps) {
  const [formData, setFormData] = useState<ContenderFormData>(() => {
    // Initialize properties with default values for all comparison properties
    const initialProperties: Record<string, string | number> = {};
    comparison.properties.forEach(prop => {
      initialProperties[prop.key] = '';
    });

    if (mode === 'edit' && existingContender) {
      return {
        name: existingContender.name,
        description: existingContender.description || '',
        pros: [...existingContender.pros, ''],
        cons: [...existingContender.cons, ''],
        hyperlinks: [...(existingContender.hyperlinks || []).map(h => h.url), ''],
        properties: { ...initialProperties, ...existingContender.properties },
        attachments: [...(existingContender.attachments || [])]
      };
    }
    return {
      name: '',
      description: '',
      pros: [''],
      cons: [''],
      hyperlinks: [''],
      properties: initialProperties,
      attachments: []
    };
  });

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [previousProperties, setPreviousProperties] = useState<Record<string, string | number> | null>(null);
  const [showUndoOption, setShowUndoOption] = useState(false);
  const [showConfigPrompt, setShowConfigPrompt] = useState(false);
  const [updatedProperties, setUpdatedProperties] = useState<Set<string>>(new Set());
  const analysisControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const contender: Contender = {
      id: mode === 'edit' ? existingContender!.id : storage.generateId(),
      comparisonId: comparison.id,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      pros: formData.pros.filter(p => p.trim()),
      cons: formData.cons.filter(c => c.trim()),
      properties: { ...formData.properties },
      attachments: [...formData.attachments],
      hyperlinks: formData.hyperlinks
        .filter(url => url.trim())
        .map(url => ({
          id: storage.generateId(),
          url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
          addedAt: new Date().toISOString()
        })),
      createdAt: existingContender?.createdAt || new Date().toISOString()
    };

    onSubmit(contender);
  };

  const updateArray = (type: 'pros' | 'cons' | 'hyperlinks', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => i === index ? value : item)
    }));
  };

  const addItem = (type: 'pros' | 'cons' | 'hyperlinks') => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const removeItem = (type: 'pros' | 'cons' | 'hyperlinks', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (file: File) => {
    return new Promise<AttachedFile>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachedFile: AttachedFile = {
          id: storage.generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result as string,
          uploadedAt: new Date().toISOString()
        };
        resolve(attachedFile);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      const attachedFile = await handleFileUpload(file);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, attachedFile]
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleAddFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(f => f.id !== fileId)
    }));
  };

  const handleAIAnalysis = async () => {
    console.log('=== AI ANALYSIS STARTING ===');
    
    // Detailed validation and error reporting
    const activeProvider = aiService.getActiveProvider();
    console.log('Active AI provider:', activeProvider);
    
    if (!aiService.isEnabled()) {
      console.log('AI service not enabled');
      setAnalysisError(`AI service not configured. Current provider: ${activeProvider}`);
      setShowConfigPrompt(true);
      return;
    }

    // Get provider configuration details
    const config = aiService.getConfig();
    if (config) {
      const activeProviderConfig = config.providers.find(p => p.provider === activeProvider);
      console.log('Provider config:', {
        provider: activeProvider,
        enabled: activeProviderConfig?.enabled,
        hasApiKey: !!(activeProviderConfig?.apiKey),
        hasBaseUrl: !!(activeProviderConfig?.baseUrl),
        model: activeProviderConfig?.model
      });

      // Validate specific requirements per provider
      if (activeProvider === 'ollama') {
        if (!activeProviderConfig?.baseUrl) {
          setAnalysisError('Ollama requires a base URL (e.g., http://localhost:11434)');
          return;
        }
        if (!activeProviderConfig?.model) {
          setAnalysisError('Ollama requires a model to be selected');
          return;
        }
      } else if (activeProvider === 'anthropic' || activeProvider === 'openai') {
        if (!activeProviderConfig?.apiKey) {
          setAnalysisError(`${activeProvider} requires an API key`);
          return;
        }
        if (!activeProviderConfig?.model) {
          setAnalysisError(`${activeProvider} requires a model to be selected`);
          return;
        }
      }
    }

    if (comparison.properties.length === 0) {
      setAnalysisError('No properties defined for analysis.');
      return;
    }

    // Check if there's any data to analyze
    const hasData = formData.attachments.length > 0 || 
                   formData.hyperlinks.some(link => link.trim()) ||
                   formData.name.trim() ||
                   formData.description.trim();
    
    if (!hasData) {
      setAnalysisError('Please add some content (name, description, files, or links) before analysis.');
      return;
    }

    // Test connectivity before starting analysis
    console.log('Testing AI service connectivity...');
    try {
      const isConnected = await aiService.testConnection();
      if (!isConnected) {
        let errorMsg = `Failed to connect to ${activeProvider}`;
        if (activeProvider === 'ollama') {
          errorMsg += '. Make sure Ollama is running and accessible at the configured URL.';
        } else {
          errorMsg += '. Check your API key and internet connection.';
        }
        setAnalysisError(errorMsg);
        return;
      }
      console.log('AI service connectivity test passed');
    } catch (error) {
      console.error('Connectivity test failed:', error);
      setAnalysisError(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowUndoOption(false);

    // Save current state before analysis to preserve any user changes
    const preAnalysisContender: Contender = {
      id: mode === 'edit' ? existingContender!.id : storage.generateId(),
      comparisonId: comparison.id,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      pros: formData.pros.filter(p => p.trim()),
      cons: formData.cons.filter(c => c.trim()),
      properties: { ...formData.properties },
      attachments: [...formData.attachments],
      hyperlinks: formData.hyperlinks
        .filter(url => url.trim())
        .map(url => ({
          id: storage.generateId(),
          url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
          addedAt: new Date().toISOString()
        })),
      createdAt: existingContender?.createdAt || new Date().toISOString()
    };
    
    // Save to storage before analysis
    storage.saveContender(preAnalysisContender);
    if (mode === 'add') {
      onSubmit(preAnalysisContender); // Notify parent of new contender
    }

    // Store current property values for undo functionality
    setPreviousProperties({ ...formData.properties });

    try {
      console.log('Building analysis content...');
      
      // Build analysis content from description only
      let content = '';
      
      if (formData.description.trim()) content += `Description: ${formData.description.trim()}\n`;

      // If we have attachments, use the first one as the primary content for AI analysis
      let analysisContent = content;
      if (formData.attachments.length > 0) {
        const primaryFile = formData.attachments[0];
        console.log('Using attachment for analysis:', {
          name: primaryFile.name,
          type: primaryFile.type,
          size: primaryFile.size
        });
        
        // Check if provider supports file analysis
        if (activeProvider === 'ollama' && primaryFile.type === 'application/pdf') {
          setAnalysisError('Ollama does not support PDF file analysis. Please use text content or switch to Claude/OpenAI for PDF support.');
          setIsAnalyzing(false);
          return;
        }
        
        // Pass the file data directly as content for PDF processing
        analysisContent = primaryFile.data;
      }

      console.log('Analysis content prepared, length:', analysisContent.length);

      // Build prompt for property extraction
      const propertyList = comparison.properties.map(p => {
        let desc = `"${p.key}": ${p.name} (${p.type})`;
        if (p.type === 'rating') desc += ' - Rate from 1-5';
        else if (p.type === 'number' && p.higherIsBetter !== undefined) {
          desc += p.higherIsBetter ? ' - Higher is better' : ' - Lower is better';
        }
        return desc;
      }).join('\n');

      console.log('Sending analysis request to AI service...');
      const result = await aiService.analyze({
        type: 'suggest_values',
        content: analysisContent,
        context: {
          existingProperties: comparison.properties,
          comparisonName: comparison.name,
          contenderName: formData.name
        }
      });
      
      console.log('AI analysis completed. Success:', result.success);

      if (result.success && result.data) {
        // Parse the response and extract property values
        let propertyValues: Record<string, string | number> = {};
        
        // Try to parse JSON response
        try {
          console.log('=== PARSING AI RESULT ===');
          console.log('result.data:', result.data);
          console.log('comparison.properties:', comparison.properties);
          
          if (typeof result.data === 'string') {
            propertyValues = JSON.parse(result.data);
          } else if (result.data.suggestions) {
            // Handle suggestions format
            console.log('Processing suggestions:', result.data.suggestions);
            result.data.suggestions.forEach((suggestion: any) => {
              console.log('Processing suggestion:', suggestion);
              const prop = comparison.properties.find(p => p.name === suggestion.property);
              console.log('Found matching property:', prop);
              if (prop && suggestion.value !== undefined && suggestion.value !== null) {
                console.log(`Setting ${prop.key} = ${suggestion.value}`);
                propertyValues[prop.key] = suggestion.value;
              }
            });
          } else if (result.data.properties) {
            // Handle properties format from extract_properties
            result.data.properties.forEach((property: any) => {
              const prop = comparison.properties.find(p => p.name === property.name);
              if (prop && property.value !== undefined && property.value !== null) {
                propertyValues[prop.key] = property.value;
              }
            });
          }
          console.log('Final propertyValues:', propertyValues);
        } catch (e) {
          console.warn('Failed to parse AI response:', e);
        }

        if (Object.keys(propertyValues).length > 0) {
          // Track which properties were updated
          const updatedKeys = new Set<string>();
          Object.keys(propertyValues).forEach(key => {
            // Only mark as updated if the value actually changed
            if (formData.properties[key] !== propertyValues[key]) {
              updatedKeys.add(key);
            }
          });
          
          // Update form data with new property values
          const updatedFormData = {
            ...formData,
            properties: { ...formData.properties, ...propertyValues }
          };
          setFormData(updatedFormData);
          setUpdatedProperties(updatedKeys);
          setShowUndoOption(true);
          
          // Auto-save the contender with updated properties
          const contender: Contender = {
            id: mode === 'edit' ? existingContender!.id : storage.generateId(),
            comparisonId: comparison.id,
            name: updatedFormData.name.trim(),
            description: updatedFormData.description.trim() || undefined,
            pros: updatedFormData.pros.filter(p => p.trim()),
            cons: updatedFormData.cons.filter(c => c.trim()),
            properties: { ...updatedFormData.properties },
            attachments: [...updatedFormData.attachments],
            hyperlinks: updatedFormData.hyperlinks
              .filter(url => url.trim())
              .map(url => ({
                id: storage.generateId(),
                url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
                addedAt: new Date().toISOString()
              })),
            createdAt: existingContender?.createdAt || new Date().toISOString()
          };
          
          // Save to storage and update parent if this is a new contender
          storage.saveContender(contender);
          if (mode === 'add') {
            onSubmit(contender); // Notify parent of new contender
          }
        } else {
          setAnalysisError('No property values could be extracted from the content.');
        }
      } else {
        setAnalysisError(result.error || 'Analysis failed.');
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancelAnalysis = () => {
    if (analysisControllerRef.current) {
      analysisControllerRef.current.abort();
      analysisControllerRef.current = null;
    }
    setIsAnalyzing(false);
    setAnalysisError(null);
  };

  const handleUndoAnalysis = () => {
    if (previousProperties) {
      // Update form state with previous properties
      const restoredFormData = {
        ...formData,
        properties: { ...previousProperties }
      };
      setFormData(restoredFormData);
      
      // Auto-save the restored state
      const contender: Contender = {
        id: mode === 'edit' ? existingContender!.id : storage.generateId(),
        comparisonId: comparison.id,
        name: restoredFormData.name.trim(),
        description: restoredFormData.description.trim() || undefined,
        pros: restoredFormData.pros.filter(p => p.trim()),
        cons: restoredFormData.cons.filter(c => c.trim()),
        properties: { ...restoredFormData.properties },
        attachments: [...restoredFormData.attachments],
        hyperlinks: restoredFormData.hyperlinks
          .filter(url => url.trim())
          .map(url => ({
            id: storage.generateId(),
            url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
            addedAt: new Date().toISOString()
          })),
        createdAt: existingContender?.createdAt || new Date().toISOString()
      };
      
      // Save restored state to storage
      storage.saveContender(contender);
      if (mode === 'add') {
        onSubmit(contender); // Notify parent of new contender
      }
      
      // Clear undo state
      setShowUndoOption(false);
      setPreviousProperties(null);
      setUpdatedProperties(new Set()); // Clear visual indicators
    }
  };

  const handleUndoProperty = (propertyKey: string) => {
    if (previousProperties && previousProperties.hasOwnProperty(propertyKey)) {
      // Restore just this property to its previous value
      const updatedFormData = {
        ...formData,
        properties: {
          ...formData.properties,
          [propertyKey]: previousProperties[propertyKey]
        }
      };
      setFormData(updatedFormData);
      
      // Remove this property from the updated set
      setUpdatedProperties(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyKey);
        return newSet;
      });
      
      // Auto-save the updated state
      const contender: Contender = {
        id: mode === 'edit' ? existingContender!.id : storage.generateId(),
        comparisonId: comparison.id,
        name: updatedFormData.name.trim(),
        description: updatedFormData.description.trim() || undefined,
        pros: updatedFormData.pros.filter(p => p.trim()),
        cons: updatedFormData.cons.filter(c => c.trim()),
        properties: { ...updatedFormData.properties },
        attachments: [...updatedFormData.attachments],
        hyperlinks: updatedFormData.hyperlinks
          .filter(url => url.trim())
          .map(url => ({
            id: storage.generateId(),
            url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
            addedAt: new Date().toISOString()
          })),
        createdAt: existingContender?.createdAt || new Date().toISOString()
      };
      
      // Save updated state to storage
      storage.saveContender(contender);
      if (mode === 'add') {
        onSubmit(contender); // Notify parent of new contender
      }
      
      // If no properties are left to undo, hide the global undo option
      if (updatedProperties.size === 1) { // Will be 0 after removal above
        setShowUndoOption(false);
        setPreviousProperties(null);
      }
    }
  };

  const handlePropertyFocus = (propertyKey: string) => {
    setUpdatedProperties(prev => {
      const newSet = new Set(prev);
      newSet.delete(propertyKey);
      return newSet;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadFile = (file: AttachedFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenFile = (file: AttachedFile) => {
    // Create a blob from the data URL for better browser compatibility
    try {
      // Convert data URL to blob
      const [header, base64Data] = file.data.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Create object URL and open it
      const objectUrl = URL.createObjectURL(blob);
      const newWindow = window.open(objectUrl, '_blank');
      
      // Clean up the object URL after a delay to allow the browser to load it
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
      
      // If window.open failed, fallback to direct data URL
      if (!newWindow) {
        window.location.href = file.data;
      }
    } catch (error) {
      console.error('Error opening file:', error);
      // Fallback to direct data URL approach
      window.open(file.data, '_blank');
    }
  };

  const renderPropertyInput = (
    property: ComparisonProperty,
    value: string | number | undefined,
    onChange: (key: string, value: string | number) => void
  ) => {
    const currentValue = value !== undefined && value !== null ? value : '';
    const isUpdated = updatedProperties.has(property.key);
    const baseClasses = "w-full px-3 py-2 bg-gray-700 border text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
    const updatedClasses = isUpdated 
      ? "border-green-400 bg-green-900/20 shadow-lg shadow-green-500/20" 
      : "border-gray-600";

    switch (property.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => onChange(property.key, e.target.value)}
            onFocus={() => handlePropertyFocus(property.key)}
            placeholder={`Enter ${property.name.toLowerCase()}`}
            className={`${baseClasses} ${updatedClasses}`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => onChange(property.key, parseFloat(e.target.value) || 0)}
            onFocus={() => handlePropertyFocus(property.key)}
            placeholder={`Enter ${property.name.toLowerCase()}`}
            className={`${baseClasses} ${updatedClasses}`}
          />
        );
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => {
                  onChange(property.key, star);
                  handlePropertyFocus(property.key);
                }}
                className={`text-2xl ${
                  (currentValue as number) >= star ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400 transition-colors`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-400">
              {currentValue ? `${currentValue}/5` : 'Not rated'}
            </span>
          </div>
        );
      case 'datetime':
        const datetimeValue = currentValue && currentValue !== '' 
          ? new Date(currentValue as string).toISOString().slice(0, 16) 
          : '';
        return (
          <input
            type="datetime-local"
            value={datetimeValue}
            onChange={(e) => onChange(property.key, e.target.value ? new Date(e.target.value).toISOString() : '')}
            onFocus={() => handlePropertyFocus(property.key)}
            className={`${baseClasses} ${updatedClasses}`}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          {mode === 'add' ? 'Add New Contender' : 'Edit Contender'}
        </h2>
        
        <div className="mb-4">
          <label htmlFor="contender-name" className="block text-sm font-medium text-gray-300 mb-2">
            Name
          </label>
          <input
            type="text"
            id="contender-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Contender name"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>


        {comparison.properties.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-200">Properties</h3>
              <div className="flex items-center gap-2">
                {analysisError && (
                  <div className="bg-red-900/20 border border-red-800 rounded-md p-2 max-w-md">
                    <span className="text-sm text-red-300">{analysisError}</span>
                  </div>
                )}
                {showUndoOption && (
                  <button
                    type="button"
                    onClick={handleUndoAnalysis}
                    className="text-xs bg-gray-600 hover:bg-gray-500 text-gray-100 px-2 py-1 rounded transition-colors"
                  >
                    ↶ Undo AI Changes
                  </button>
                )}
                {isAnalyzing ? (
                  <button
                    type="button"
                    onClick={handleCancelAnalysis}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-md transition-colors"
                  >
                    <span className="animate-spin">⟳</span>
                    Cancel Analysis
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAIAnalysis}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm px-3 py-1 rounded-md transition-all transform hover:scale-105 shadow-lg"
                    title="Use AI to analyze attached files and links to automatically fill property values"
                  >
                    <span className="text-xs">⚡</span>
                    AI Analyze
                  </button>
                )}
              </div>
            </div>
            
            {showConfigPrompt && (
              <AIConfigPrompt 
                className="mb-4" 
                onDismiss={() => setShowConfigPrompt(false)}
              />
            )}
            
            <div className="space-y-3">
              {comparison.properties.map((property) => (
                <div key={property.key} className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-300 min-w-0 flex-shrink-0 w-32">
                    {property.name}:
                  </label>
                  <div className="flex-1">
                    {renderPropertyInput(
                      property,
                      formData.properties[property.key],
                      (key, value) => setFormData(prev => ({
                        ...prev,
                        properties: { ...prev.properties, [key]: value }
                      }))
                    )}
                  </div>
                  {updatedProperties.has(property.key) && previousProperties && (
                    <button
                      type="button"
                      onClick={() => handleUndoProperty(property.key)}
                      className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded transition-colors flex items-center gap-1 flex-shrink-0"
                      title={`Undo AI change for ${property.name}`}
                    >
                      <span className="text-xs">↶</span>
                      Undo
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-200 mb-3">File Attachments</h3>
          <div 
            className="border border-dashed border-gray-600 rounded-lg p-4 hover:border-blue-400 hover:bg-gray-700 transition-colors"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleAddFile}
              className="mb-3 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
            />
            <p className="text-sm text-gray-400 mb-3">Drag & drop a file here or click to browse • Maximum file size: 5MB</p>
            
            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-300">Attached Files:</h4>
                {formData.attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-700 rounded-md">
                    <div className="flex items-center space-x-2 flex-1">
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(file)}
                        className="text-sm font-medium text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors"
                        title="Click to download file"
                      >
                        {file.name}
                      </button>
                      <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenFile(file)}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors"
                        title="Open in browser"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded transition-colors"
                        title="Remove file"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Hyperlinks
          </label>
          {formData.hyperlinks.map((link, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={link}
                onChange={(e) => updateArray('hyperlinks', index, e.target.value)}
                placeholder="Enter a URL (e.g., https://example.com)"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.hyperlinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem('hyperlinks', index)}
                  className="text-red-600 hover:text-red-800 px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addItem('hyperlinks')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            + Add Hyperlink
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pros
            </label>
            {formData.pros.map((pro, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={pro}
                  onChange={(e) => updateArray('pros', index, e.target.value)}
                  placeholder="Enter a pro"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {formData.pros.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem('pros', index)}
                    className="text-red-600 hover:text-red-800 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem('pros')}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              + Add Pro
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cons
            </label>
            {formData.cons.map((con, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={con}
                  onChange={(e) => updateArray('cons', index, e.target.value)}
                  placeholder="Enter a con"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {formData.cons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem('cons', index)}
                    className="text-red-600 hover:text-red-800 px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem('cons')}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              + Add Con
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition-colors"
          >
            {mode === 'add' ? 'Add Contender' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-500 text-gray-100 font-semibold px-4 py-2 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
